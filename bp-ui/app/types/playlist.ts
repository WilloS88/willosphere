import type { TrackDto } from "./track";

export type PlaylistTrackItem = {
  position: number;
  track:    TrackDto;
};

export type PlaylistDto = {
  id:              number;
  title:           string;
  userId:          number;
  isPublic:        boolean;
  isCollaborative: boolean;
  trackCount:      number;
  tracks?:         PlaylistTrackItem[];
  createdAt:       string;
  updatedAt:       string;
};
