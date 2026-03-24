import { IsInt, Min } from "class-validator";

export class AddTrackDto {
  @IsInt()
  @Min(1)
  trackId!: number;
}
