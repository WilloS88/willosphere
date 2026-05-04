import { INestApplication } from "@nestjs/common";
import { DataSource } from "typeorm";
import * as request from "supertest";
import type { App } from "supertest/types";

import { bootstrapTestApp, truncateAllTables } from "./utils/test-app.factory";
import { TestDataSeeder, SeededUser } from "./utils/test-data.seeder";

describe("Playlists (e2e)", () => {
  let app: INestApplication;
  let ds: DataSource;
  let seeder: TestDataSeeder;
  let server: App;

  beforeAll(async () => {
    const built = await bootstrapTestApp();
    app = built.app;
    ds = built.dataSource;
    seeder = TestDataSeeder.fromApp(app);
    server = app.getHttpServer() as App;
  });

  beforeEach(async () => {
    await truncateAllTables(ds);
  });

  afterAll(async () => {
    await app.close();
  });

  /** Provede login a vrátí cookie jar (pole hlaviček). */
  const loginJar = async (user: SeededUser): Promise<string[]> => {
    const res = await request(server)
      .post("/auth/login")
      .send({ email: user.email, password: user.password })
      .expect(201);
    const raw = res.headers["set-cookie"];
    return Array.isArray(raw) ? raw : raw ? [raw] : [];
  };

  // ---------------------------------------------------------------------------
  it("owner can create, fetch, update and delete their playlist", async () => {
    const owner = await seeder.createListener("owner");
    const ownerJar = await loginJar(owner);

    // CREATE
    const createRes = await request(server)
      .post("/playlists")
      .set("Cookie", ownerJar)
      .send({ title: "Owner's Mix", isPublic: true })
      .expect(201);

    const playlistId: number = createRes.body.id;
    expect(typeof playlistId).toBe("number");
    expect(createRes.body.title).toBe("Owner's Mix");
    expect(createRes.body.userId).toBe(owner.id);

    // GET
    const getRes = await request(server)
      .get(`/playlists/${playlistId}`)
      .expect(200);
    expect(getRes.body.id).toBe(playlistId);

    // UPDATE
    const patchRes = await request(server)
      .patch(`/playlists/${playlistId}`)
      .set("Cookie", ownerJar)
      .send({ title: "Renamed Mix" })
      .expect(200);
    expect(patchRes.body.title).toBe("Renamed Mix");

    // DELETE
    await request(server)
      .delete(`/playlists/${playlistId}`)
      .set("Cookie", ownerJar)
      .expect(204);

    await request(server).get(`/playlists/${playlistId}`).expect(404);
  });

  it("rejects update by a non-owner (IDOR -> 403)", async () => {
    const owner = await seeder.createListener("idor-owner");
    const intruder = await seeder.createListener("idor-intruder");

    const ownerJar = await loginJar(owner);
    const intruderJar = await loginJar(intruder);

    const createRes = await request(server)
      .post("/playlists")
      .set("Cookie", ownerJar)
      .send({ title: "Private Mix" })
      .expect(201);

    await request(server)
      .patch(`/playlists/${createRes.body.id}`)
      .set("Cookie", intruderJar)
      .send({ title: "Hijacked" })
      .expect(403);

    await request(server)
      .delete(`/playlists/${createRes.body.id}`)
      .set("Cookie", intruderJar)
      .expect(403);
  });

  it("blocks unauthenticated mutation requests (401)", async () => {
    await request(server)
      .post("/playlists")
      .send({ title: "Anonymous" })
      .expect(401);
  });

  it("blocks listener access to admin endpoints (role-based 403)", async () => {
    const listener = await seeder.createListener("role-listener");
    const jar = await loginJar(listener);

    await request(server)
      .get("/admin/stats")
      .set("Cookie", jar)
      .expect(403);
  });

  it("rejects malformed playlist payload (400 — DTO validation)", async () => {
    const owner = await seeder.createListener("dto-owner");
    const jar = await loginJar(owner);

    // title chybí → IsString + IsNotEmpty selže.
    await request(server)
      .post("/playlists")
      .set("Cookie", jar)
      .send({ isPublic: true })
      .expect(400);

    // Non-whitelisted prop → forbidNonWhitelisted vrátí 400.
    await request(server)
      .post("/playlists")
      .set("Cookie", jar)
      .send({ title: "OK", maliciousFlag: true })
      .expect(400);
  });
});
