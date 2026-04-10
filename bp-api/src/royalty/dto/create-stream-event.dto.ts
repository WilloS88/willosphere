import { IsEnum, IsInt, IsOptional, Min } from "class-validator";
import { StreamSource } from "../../entities/stream-event.entity";

export class CreateStreamEventDto {
  @IsInt()
  @Min(1)
  trackId!: number;

  @IsEnum(StreamSource)
  source!: StreamSource;

  @IsInt()
  @Min(0)
  listenDurationSec!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  trackDurationSec?: number;
}
