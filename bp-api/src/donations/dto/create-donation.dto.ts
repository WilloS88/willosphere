import { IsNumber, Min, Max } from "class-validator";

export class CreateDonationDto {
  @IsNumber()
  @Min(1)
  @Max(100000)
  amount!: number;
}
