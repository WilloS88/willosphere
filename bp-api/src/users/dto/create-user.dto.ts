import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf
} from "class-validator";
import { Role } from "../../entities/role.enum";

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3) // pro vyvojove ucely, pak zmenit na delsi!!
  password!: string;

  @IsString()
  @IsNotEmpty()
  displayName!: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  profileImageUrl?: string | null;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
