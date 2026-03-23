import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import * as bcrypt from "bcryptjs";
import { Role } from "../entities/role.enum";
import { User } from "../entities/user.entity";
import { UserRole } from "../entities/user-role.entity";
import { ArtistProfile } from "../entities/artist-profile.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { SignupAsArtistDto } from "../auth/dto/signup-artist.dto";
import { ListUsersQueryDto } from "./dto/list-users-query.dto";
import { PaginatedResult } from "../common/dto/paginated-result";
import { UserDTO } from "./dto/user.dto";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(UserRole) private readonly userRoleRepo: Repository<UserRole>,
    @InjectRepository(ArtistProfile) private readonly artistProfileRepo: Repository<ArtistProfile>,
    @InjectDataSource() private readonly ds: DataSource,
  ) {}

  async findAllList(dto: ListUsersQueryDto): Promise<PaginatedResult<UserDTO>> {
    const page  = dto.page  ?? 1;
    const limit = dto.limit ?? 20;

    const ALLOWED_SORT: Record<string, string> = {
      id:          "u.id",
      email:       "u.email",
      displayName: "u.displayName",
    };
    const sortCol = (dto.sortBy && ALLOWED_SORT[dto.sortBy]) ? ALLOWED_SORT[dto.sortBy] : "u.id";
    const sortDir = dto.sortDir ?? "ASC";

    const qb = this.usersRepo
      .createQueryBuilder("u")
      .leftJoinAndSelect("u.roles", "ur");

    if (dto.email)
      qb.andWhere("u.email LIKE :email", { email: `%${dto.email}%` });

    if (dto.displayName)
      qb.andWhere("u.displayName LIKE :dn", { dn: `%${dto.displayName}%` });

    if (dto.role)
      qb.innerJoin("u.roles", "rf", "rf.role = :role", { role: dto.role });

    qb.orderBy(sortCol, sortDir)
      .skip((page - 1) * limit)
      .take(limit);

    const [users, total] = await qb.getManyAndCount();

    return { data: users.map(UserDTO.fromEntity), total, page, limit };
  }

  async findById(id: number): Promise<User> {
    const u = await this.usersRepo.findOne({
      where: { id },
      relations: ["roles", "artistProfile"],
    });
    if (!u) throw new NotFoundException("User not found");
    return u;
  }

  findByEmail(email: string) {
    return this.usersRepo.findOne({
      where:    { email },
      select:   ["id", "email", "passwordHash"],
    });
  }

  async create(dto: CreateUserDto): Promise<User> {
    const exists = await this.usersRepo.findOne({
      where: { email: dto.email },
    });
    if(exists)
      throw new ConflictException("Email already in use");

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.usersRepo.create({
      email:            dto.email,
      passwordHash,
      displayName:      dto.displayName,
      timezone:         dto.timezone ?? "UTC",
      language:         dto.language ?? "en",
      profileImageUrl:  dto.profileImageUrl,
    });

    return await this.ds.transaction(async (trx) => {
      const saved = await trx.getRepository(User).save(user);
      
      await trx
        .getRepository(UserRole)
        .save({
          userId: saved.id,
          role: dto.role ?? Role.LISTENER,
        });

      return trx.getRepository(User).findOneOrFail({
        where:      { id: saved.id },
        relations:  ["roles", "artistProfile"],
      });
    });
  }

  async createWithArtistProfile(dto: SignupAsArtistDto): Promise<User> {
    const exists = await this.usersRepo.findOne({ where: { email: dto.email } });
    if(exists)
      throw new ConflictException("Email already in use");

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.usersRepo.create({
      email:        dto.email,
      passwordHash,
      displayName:  dto.displayName,
      timezone:     dto.timezone ?? "UTC",
      language:     dto.language ?? "en",
    });

    return this.ds.transaction(async (trx) => {
      const saved = await trx.getRepository(User).save(user);

      await trx.getRepository(UserRole).save({ userId: saved.id, role: Role.ARTIST });

      await trx.getRepository(ArtistProfile).save({
        userId:         saved.id,
        bio:            dto.bio ?? null,
        bannerImageUrl: dto.bannerImageUrl ?? null,
        artistSince:    dto.artistSince ?? null,
      });

      return trx.getRepository(User).findOneOrFail({
        where:     { id: saved.id },
        relations: ["roles", "artistProfile"],
      });
    });
  }

  async update(id: number, dto: UpdateUserDto) {
    console.log("UPDATE DTO", dto);
    return this.ds.transaction(async (trx) => {
      const userRepo = trx.getRepository(User);
      const roleRepo = trx.getRepository(UserRole);

      const user = await userRepo.findOne({ where: { id } });
      if (!user) throw new NotFoundException("User not found");

      if(dto.password)
        user.passwordHash     = await bcrypt.hash(dto.password, 12);
      if(dto.displayName)
        user.displayName      = dto.displayName;
      if(dto.timezone)
        user.timezone         = dto.timezone;
      if(dto.language)
        user.language         = dto.language;
      if(dto.profileImageUrl !== undefined)
        user.profileImageUrl  = dto.profileImageUrl;

      await userRepo.save(user);

      if(dto.role) {
        await roleRepo.delete({ userId: id });
        await roleRepo.save({ userId: id, role: dto.role });
      }

      return userRepo.findOneOrFail({
        where: { id },
        relations: ["roles", "artistProfile"],
      });
    });
  }

  async remove(id: number) {
    await this.ds.transaction(async (trx) => {
      const exists = await trx.getRepository(User).findOne({ where: { id } });
      if(!exists)
        throw new NotFoundException("User not found");

      await trx.getRepository(UserRole).delete({ userId: id });
      await trx.getRepository(User).delete({ id });
    });
  }
}
