import { IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";
import { StreamSource } from "../../entities/stream-event.entity";

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

  @IsOptional()
  @IsEnum(StreamSource)
  source?: StreamSource;

  @IsOptional()
  @IsInt()
  @Min(1)
  trackDurationSec?: number;
}
