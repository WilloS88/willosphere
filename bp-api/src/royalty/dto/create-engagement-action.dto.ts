import { IsEnum, IsInt, IsOptional, Min } from "class-validator";
import { EngagementActionType } from "../../entities/engagement-action.entity";

export class CreateEngagementActionDto {
  @IsEnum(EngagementActionType)
  actionType!: EngagementActionType;

  @IsInt()
  @Min(1)
  artistId!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  trackId?: number;
}
