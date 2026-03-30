import { IsNotEmpty, IsString, Length } from "class-validator";

export class MfaVerifyDto {
  @IsString()
  @IsNotEmpty()
  challengeId!: string;

  @IsString()
  @Length(6, 6, { message: "TOTP code must be exactly 6 digits" })
  code!: string;
}

export class MfaConfirmDto {
  @IsString()
  @Length(6, 6, { message: "TOTP code must be exactly 6 digits" })
  code!: string;
}
