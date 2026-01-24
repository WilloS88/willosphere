import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import * as bcrypt from "bcryptjs";
import { Role } from "../entities/role.enum";
import { User } from "../entities/user.entity";
import { UserRole } from "../entities/user-role.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(UserRole)
    private readonly rolesRepo: Repository<UserRole>,
    private readonly ds: DataSource,
  ) {}

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
        .save({ userId: saved.id, role: Role.LISTENER });

      return trx.getRepository(User).findOneOrFail({
        where:      { id: saved.id },
        relations:  ["roles", "artistProfile"],
      });
    });
  }

  async findAll() {
    return this.usersRepo.find({
      relations:  ["roles", "artistProfile"],
      order:      { id: "ASC" },
    });
  }

  findById(id: number) {
    return this.usersRepo.findOne({
      where:      { id },
      relations:  ["roles", "artistProfile"],
    });
  }

  findByEmail(email: string) {
    return this.usersRepo.findOne({
      where:    { email },
      select:   ["id", "email", "passwordHash"],
    });
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if(!user)
      throw new NotFoundException();

    if(dto.password)
      user.passwordHash = await bcrypt.hash(dto.password, 12);
    if(dto.displayName)
      user.displayName  = dto.displayName;
    if(dto.timezone)
      user.timezone     = dto.timezone;
    if(dto.language)
      user.language     = dto.language;
    if(dto.profileImageUrl !== undefined)
      user.profileImageUrl = dto.profileImageUrl;

    await this.usersRepo.save(user);

    return this.findById(id);
  }

  async addRole(userId: number, role: Role) {
    await this.rolesRepo.save({ userId, role });

    return this.findById(userId);
  }

  async removeRole(userId: number, role: Role) {
    await this.rolesRepo.delete({ userId, role });
    
    return this.findById(userId);
  }
}
