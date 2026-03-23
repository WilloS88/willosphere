import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { ArtistProfile } from "../entities/artist-profile.entity";
import { Role } from "../entities/role.enum";
import { User } from "../entities/user.entity";
import { UserRole } from "../entities/user-role.entity";
import { ArtistDto } from "./dto/artist.dto";
import { BecomeArtistDto } from "./dto/become-artist.dto";
import { UpdateArtistProfileDto } from "./dto/update-artist-profile.dto";

@Injectable()
export class ArtistsService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(ArtistProfile)
    private readonly profileRepo: Repository<ArtistProfile>,
    @InjectDataSource()
    private readonly ds: DataSource,
  ) {}

  async findAll(): Promise<ArtistDto[]> {
    const profiles = await this.profileRepo
      .createQueryBuilder("ap")
      .innerJoinAndSelect("ap.user", "u")
      .orderBy("ap.createdAt", "ASC")
      .getMany();

    return profiles.map((p) => ArtistDto.fromEntities(p.user, p));
  }

  async findOne(userId: number): Promise<ArtistDto> {
    const profile = await this.profileRepo.findOne({
      where: { userId },
      relations: ["user"],
    });

    if(!profile)
      throw new NotFoundException("Artist not found");

    return ArtistDto.fromEntities(profile.user, profile);
  }

  async becomeArtist(userId: number, dto: BecomeArtistDto): Promise<ArtistDto> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ["roles"],
    });

    if(!user)
      throw new NotFoundException("User not found");

    const alreadyArtist = user.roles.some((r) => r.role === Role.ARTIST);

    if(alreadyArtist)
      throw new ConflictException("User is already an artist");

    return this.ds.transaction(async (trx) => {
      await trx.getRepository(UserRole).save({ userId, role: Role.ARTIST });

      const profile = trx.getRepository(ArtistProfile).create({
        userId,
        bio:            dto.bio ?? null,
        bannerImageUrl: dto.bannerImageUrl ?? null,
        artistSince:    dto.artistSince ?? null,
      });
      const savedProfile = await trx.getRepository(ArtistProfile).save(profile);

      return ArtistDto.fromEntities(user, savedProfile);
    });
  }

  async updateProfile(userId: number, dto: UpdateArtistProfileDto): Promise<ArtistDto> {
    const profile = await this.profileRepo.findOne({
      where: { userId },
      relations: ["user"],
    });

    if (!profile)
      throw new NotFoundException("Artist profile not found");

    if(dto.bio !== undefined)
      profile.bio             = dto.bio;
    if(dto.bannerImageUrl !== undefined)
      profile.bannerImageUrl  = dto.bannerImageUrl;
    if(dto.artistSince !== undefined)
      profile.artistSince     = dto.artistSince;

    const saved = await this.profileRepo.save(profile);

    return ArtistDto.fromEntities(profile.user, saved);
  }

  async resign(userId: number): Promise<void> {
    const profile = await this.profileRepo.findOne({ where: { userId } });

    if (!profile)
      throw new NotFoundException("Artist profile not found");

    await this.ds.transaction(async (trx) => {
      await trx.getRepository(ArtistProfile).delete({ userId });
      await trx.getRepository(UserRole).delete({ userId, role: Role.ARTIST });
    });
  }
}
