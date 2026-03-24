import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { Playlist } from "./playlist.entity";
import { Track } from "./track.entity";

@Entity("Playlist_Track")
export class PlaylistTrack {
  @PrimaryColumn({ name: "playlist_id", type: "int" })
  playlistId!: number;

  @PrimaryColumn({ type: "int" })
  position!: number;

  @Column({ name: "track_id", type: "int" })
  trackId!: number;

  @CreateDateColumn({
    name: "added_at",
    type: "datetime",
    default: () => "CURRENT_TIMESTAMP",
  })
  addedAt!: Date;

  @ManyToOne(() => Playlist, (p) => p.playlistTracks, { onDelete: "CASCADE" })
  @JoinColumn({ name: "playlist_id" })
  playlist!: Playlist;

  @ManyToOne(() => Track, { onDelete: "CASCADE", eager: false })
  @JoinColumn({ name: "track_id" })
  track!: Track;
}
