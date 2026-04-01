import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreateListenHistoryDto {
  @IsInt()
  @Min(1)
  trackId!: number;

  @IsInt()
  @Min(0)
  secondsPlayed!: number;

  @IsOptional()
  @IsString()
  deviceInfo?: string;
}
