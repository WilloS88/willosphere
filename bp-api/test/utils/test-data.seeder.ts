import { INestApplication } from "@nestjs/common";
import { DataSource } from "typeorm";
import * as bcrypt from "bcryptjs";

import { User } from "../../src/entities/user.entity";
import { UserRole } from "../../src/entities/user-role.entity";
import { Role } from "../../src/entities/role.enum";

export interface SeededUser {
  id:               number;
  email:            string;
  password:         string;
  displayName:      string;
  role:             Role;
}

export class TestDataSeeder {
  constructor(private readonly ds: DataSource) {}

  static fromApp(app: INestApplication): TestDataSeeder {
    return new TestDataSeeder(app.get(DataSource));
  }

  async createUser(opts: {
    email:          string;
    password:       string;
    displayName:    string;
    role?:          Role;
  }): Promise<SeededUser> {
    const role          = opts.role ?? Role.LISTENER;
    const passwordHash  = await bcrypt.hash(opts.password, 4);

    const userRepo = this.ds.getRepository(User);
    const roleRepo = this.ds.getRepository(UserRole);

    const saved = await userRepo.save(
      userRepo.create({
        email: opts.email,
        passwordHash,
        displayName: opts.displayName,
        timezone: "UTC",
        language: "en",
      }),
    );

    await roleRepo.save({ userId: saved.id, role });

    return {
      id: saved.id,
      email: opts.email,
      password: opts.password,
      displayName: opts.displayName,
      role,
    };
  }

  createListener(prefix: string): Promise<SeededUser> {
    return this.createUser({
      email: `${prefix}@willosphere.test`,
      password: "ListenerPass123!",
      displayName: `${prefix} listener`,
      role: Role.LISTENER,
    });
  }

  createArtist(prefix: string): Promise<SeededUser> {
    return this.createUser({
      email: `${prefix}@willosphere.test`,
      password: "ArtistPass123!",
      displayName: `${prefix} artist`,
      role: Role.ARTIST,
    });
  }

  createAdmin(prefix: string): Promise<SeededUser> {
    return this.createUser({
      email: `${prefix}@willosphere.test`,
      password: "AdminPass123!",
      displayName: `${prefix} admin`,
      role: Role.ADMIN,
    });
  }
}
