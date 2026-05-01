export class TopTrackDto {
  trackId!: number;
  title!: string;
  coverImageUrl!: string | null;
  plays!: number;
}

export class DailyPlaysDto {
  date!: string;
  plays!: number;
}

export class MonthlyPlaysDto {
  month!: string;
  plays!: number;
}

export class ArtistStatsDto {
  totalPlays!: number;
  playsToday!: number;
  playsThisMonth!: number;
  uniqueListeners!: number;
  topTracks!: TopTrackDto[];
  dailyPlays!: DailyPlaysDto[];
  monthlyPlays!: MonthlyPlaysDto[];
}
