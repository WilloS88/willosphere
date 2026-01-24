import { IsString, IsUUID } from "class-validator";

export class RefreshTokenDto {
  @IsString()
	@IsUUID("4")
  refreshToken: string;
}
