import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SeedService } from "./seed.service";
import { AlgorithmConfig } from "../entities/algorithm-config.entity";
import { Genre } from "../entities/genre.entity";
import { User } from "../entities/user.entity";
import { UserRole } from "../entities/user-role.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([AlgorithmConfig, Genre, User, UserRole]),
  ],
  providers: [SeedService],
})
export class SeedModule {}
