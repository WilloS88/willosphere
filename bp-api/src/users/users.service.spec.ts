import { Test, TestingModule } from "@nestjs/testing";
import { ConflictException } from "@nestjs/common";
import { getRepositoryToken, getDataSourceToken } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

import { UsersService } from "./users.service";
import { User } from "../entities/user.entity";
import { UserRole } from "../entities/user-role.entity";
import { ArtistProfile } from "../entities/artist-profile.entity";
import { Role } from "../entities/role.enum";

interface MockRepo {
  findOne:              jest.Mock;
  count:                jest.Mock;
  save:                 jest.Mock;
  create:               jest.Mock;
  delete:               jest.Mock;
  findOneOrFail:        jest.Mock;
  createQueryBuilder:   jest.Mock;
}

const newRepo = (): MockRepo => ({
  findOne:              jest.fn(),
  count:                jest.fn(),
  save:                 jest.fn(),
  create:               jest.fn((x) => x),
  delete:               jest.fn(),
  findOneOrFail:        jest.fn(),
  createQueryBuilder:   jest.fn(),
});

describe("UsersService", () => {
  let service:              UsersService;
  let usersRepo:            MockRepo;
  let userRoleRepo:         MockRepo;
  let artistProfileRepo:    MockRepo;
  let ds: { transaction: jest.Mock };

  beforeEach(async () => {
    usersRepo           = newRepo();
    userRoleRepo        = newRepo();
    artistProfileRepo   = newRepo();
    ds = { transaction: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: getRepositoryToken(UserRole), useValue: userRoleRepo },
        {
          provide: getRepositoryToken(ArtistProfile),
          useValue: artistProfileRepo,
        },
        { provide: getDataSourceToken(), useValue: ds as unknown as DataSource },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe("emailExists", () => {
    it("returns true when count > 0", async () => {
      usersRepo.count.mockResolvedValue(1);
      await expect(service.emailExists("a@b.c")).resolves.toBe(true);
      expect(usersRepo.count).toHaveBeenCalledWith({ where: { email: "a@b.c" } });
    });

    it("returns false when count = 0", async () => {
      usersRepo.count.mockResolvedValue(0);
      await expect(service.emailExists("nope@b.c")).resolves.toBe(false);
    });
  });

  describe("create", () => {
    it("throws ConflictException when email already exists", async () => {
      usersRepo.findOne.mockResolvedValue({ id: 1 });

      await expect(
        service.create({
          email: "dup@b.c",
          password: "Pass123!",
          displayName: "Dup",
        } as never),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(ds.transaction).not.toHaveBeenCalled();
    });

    it("creates user with default LISTENER role inside a transaction", async () => {
      usersRepo.findOne.mockResolvedValue(null);

      const trxUserRepo = {
        save: jest.fn().mockResolvedValue({ id: 99, email: "new@b.c" }),
        findOneOrFail: jest.fn().mockResolvedValue({
          id: 99,
          email: "new@b.c",
          roles: [{ role: Role.LISTENER }],
        }),
      };
      const trxUserRoleRepo = { save: jest.fn().mockResolvedValue({}) };

      ds.transaction.mockImplementation(
        async (cb: (m: { getRepository: jest.Mock }) => unknown) =>
          cb({
            getRepository: jest.fn((entity: unknown) => {
              if (entity === User) return trxUserRepo;
              if (entity === UserRole) return trxUserRoleRepo;
              return undefined;
            }),
          }),
      );

      const result = await service.create({
        email: "new@b.c",
        password: "Pass123!",
        displayName: "New",
      } as never);

      expect(result).toMatchObject({ id: 99, email: "new@b.c" });
      expect(trxUserRepo.save).toHaveBeenCalledTimes(1);
      expect(trxUserRoleRepo.save).toHaveBeenCalledWith({
        userId: 99,
        role: Role.LISTENER,
      });
    });

    it("respects an explicit role from the DTO", async () => {
      usersRepo.findOne.mockResolvedValue(null);

      const savedRole = jest.fn().mockResolvedValue({});
      ds.transaction.mockImplementation(
        async (cb: (m: { getRepository: jest.Mock }) => unknown) =>
          cb({
            getRepository: jest.fn((entity: unknown) => {
              if (entity === User) {
                return {
                  save: jest.fn().mockResolvedValue({ id: 7 }),
                  findOneOrFail: jest.fn().mockResolvedValue({ id: 7 }),
                };
              }
              if (entity === UserRole) return { save: savedRole };
              return undefined;
            }),
          }),
      );

      await service.create({
        email: "artist@b.c",
        password: "Pass123!",
        displayName: "Artist",
        role: Role.ARTIST,
      } as never);

      expect(savedRole).toHaveBeenCalledWith({
        userId: 7,
        role: Role.ARTIST,
      });
    });
  });
});
