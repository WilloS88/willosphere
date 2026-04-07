import { TrackDto } from "../tracks/dto/track.dto";

export class LandingStatsDto {
  totalArtists!:   number;
  totalTracks!:    number;
  totalListeners!: number;
  totalPlays!:     number;
}

export class SpotlightArtistDto {
  userId!:          number;
  displayName!:     string;
  profileImageUrl!: string | null;
  trackCount!:      number;
}

export class LandingGenreDto {
  id!:         number;
  name!:       string;
  trackCount!: number;
}

export class LandingDto {
  stats!:            LandingStatsDto;
  spotlightArtists!: SpotlightArtistDto[];
  trendingTracks!:   TrackDto[];
  genres!:           LandingGenreDto[];
}
