import { IsString, Matches } from "class-validator";

export class CalculateRoyaltiesDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: "month must be in YYYY-MM format" })
  month!: string;
}
