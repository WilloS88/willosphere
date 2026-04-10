import { IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateAlgorithmConfigDto {
  @IsNumber()
  paramValue!: number;

  @IsOptional()
  @IsString()
  description?: string;
}
