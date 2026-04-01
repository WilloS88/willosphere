import { ListenHistory } from "../../entities/listen-history.entity";

export class ListenHistoryTrackInfo {
  id!: number;
  title!: string;
  durationSeconds!: number;
  audioUrl!: string;
  coverImageUrl?: string | null;
}

export class ListenHistoryDto {
  id!: number;
  trackId!: number;
  track!: ListenHistoryTrackInfo;
  listenedAt!: Date;
  secondsPlayed!: number;

  static fromEntity(entity: ListenHistory): ListenHistoryDto {
    const dto = new ListenHistoryDto();
    dto.id = entity.id;
    dto.trackId = entity.trackId;
    dto.listenedAt = entity.listenedAt;
    dto.secondsPlayed = entity.secondsPlayed;

    if (entity.track) {
      dto.track = {
        id: entity.track.id,
        title: entity.track.title,
        durationSeconds: entity.track.durationSeconds,
        audioUrl: entity.track.audioUrl,
        coverImageUrl: entity.track.coverImageUrl ?? null,
      };
    }

    return dto;
  }
}
