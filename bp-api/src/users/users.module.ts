import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.entity';
import { ArtistProfile } from '../entities/artist-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserRole, ArtistProfile])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
