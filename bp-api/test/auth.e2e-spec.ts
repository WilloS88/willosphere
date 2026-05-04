import { INestApplication } from "@nestjs/common";
import { DataSource } from "typeorm";
import * as request from "supertest";
import type { App } from "supertest/types";

import { bootstrapTestApp, truncateAllTables } from "./utils/test-app.factory";
import { TestDataSeeder } from "./utils/test-data.seeder";
import { RefreshToken } from "../src/entities/refresh-token.entity";

describe("Auth flow (e2e)", () => {
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

  const cookiesOf = (res: request.Response): string[] => {
    const raw = res.headers["set-cookie"];
    if (!raw)
    return [];
    return Array.isArray(raw) ? raw : [raw];
  };

  const cookieValue = (jar: string[], name: string): string | undefined => {
    for (const c of jar) {
      const match = c.match(new RegExp(`${name}=([^;]+)`));
      if (match) return match[1];
    }
    return undefined;
  };

  it("registers a new user and returns the user payload + auth cookies", async () => {
    const res = await request(server)
      .post("/auth/signup")
      .send({
        email: "newbie@willosphere.test",
        password: "StrongPass1!",
        displayName: "Newbie",
      })
      .expect(201);

    expect(res.body.user).toMatchObject({
      email: "newbie@willosphere.test",
      displayName: "Newbie",
    });
    const jar = cookiesOf(res);
    expect(cookieValue(jar, "access_token")).toBeDefined();
    expect(cookieValue(jar, "refresh_token")).toBeDefined();
    expect(cookieValue(jar, "device_id")).toBeDefined();
  });

  it("logs in with correct credentials, /me returns the same user, refresh rotates the token, logout revokes it", async () => {
    const user = await seeder.createListener("flow-user");

    // 1) Login
    const loginRes = await request(server)
      .post("/auth/login")
      .send({ email: user.email, password: user.password })
      .expect(201);

    const loginJar = cookiesOf(loginRes);
    const accessToken = cookieValue(loginJar, "access_token");
    const initialRefreshToken = cookieValue(loginJar, "refresh_token");
    const deviceId = cookieValue(loginJar, "device_id");

    expect(accessToken).toBeDefined();
    expect(initialRefreshToken).toBeDefined();
    expect(deviceId).toBeDefined();

    const meRes = await request(server)
      .get("/auth/me")
      .set("Cookie", loginJar)
      .expect(200);
    expect(meRes.body.email).toBe(user.email);

    const refreshRes = await request(server)
      .post("/auth/refresh")
      .set("Cookie", loginJar)
      .expect(201);
    const newJar = cookiesOf(refreshRes);
    const rotatedRefreshToken = cookieValue(newJar, "refresh_token");
    expect(rotatedRefreshToken).toBeDefined();
    expect(rotatedRefreshToken).not.toBe(initialRefreshToken);

    await request(server)
      .post("/auth/logout")
      .set("Cookie", newJar)
      .expect(201);

    const refreshTokenRows = await ds.getRepository(RefreshToken).find();
    expect(refreshTokenRows.length).toBeGreaterThan(0);
    expect(refreshTokenRows.every((rt) => rt.revokedAt !== null)).toBe(true);
  });

  it("rejects login with wrong password (401) and unknown email (401)", async () => {
    const user = await seeder.createListener("login-neg");

    await request(server)
      .post("/auth/login")
      .send({ email: user.email, password: "totally-wrong" })
      .expect(401);

    await request(server)
      .post("/auth/login")
      .send({
        email: "ghost@willosphere.test",
        password: user.password,
      })
      .expect(401);
  });

  it("blocks /auth/me without an access token (401)", async () => {
    await request(server).get("/auth/me").expect(401);
  });

  it("rejects reuse of an already-rotated refresh token (theft detection)", async () => {
    const user = await seeder.createListener("reuse-target");

    const loginRes = await request(server)
      .post("/auth/login")
      .send({ email: user.email, password: user.password })
      .expect(201);

    const initialJar = cookiesOf(loginRes);

    await request(server)
      .post("/auth/refresh")
      .set("Cookie", initialJar)
      .expect(201);

    await request(server)
      .post("/auth/refresh")
      .set("Cookie", initialJar)
      .expect(401);
  });

  it("rejects signup with a duplicate email (409)", async () => {
    const user = await seeder.createListener("dup-target");

    await request(server)
      .post("/auth/signup")
      .send({
        email: user.email,
        password: "AnotherPass1!",
        displayName: "Impostor",
      })
      .expect(409);
  });

  it("rejects signup with a non-whitelisted property (400)", async () => {
    await request(server)
      .post("/auth/signup")
      .send({
        email: "validation@willosphere.test",
        password: "ValidPass1!",
        displayName: "WL Tester",
        isAdmin: true,
      })
      .expect(400);
  });
});
