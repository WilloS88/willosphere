import { IsOptional, IsString, MinLength } from "class-validator";

export class UpdateUserDto {
  // @IsOptional()
  // @IsEmail()
  // email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  profileImageUrl?: string;
}
