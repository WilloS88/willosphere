import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./user.entity";
import { Track } from "./track.entity";

export enum StreamSource {
  SEARCH = "search",
  ARTIST_PAGE = "artist_page",
  DIRECT_LINK = "direct_link",
  USER_PLAYLIST = "user_playlist",
  BROWSE = "browse",
  EDITORIAL = "editorial",
  ALGORITHM = "algorithm",
  RADIO = "radio",
}

@Entity("stream_events")
@Index("idx_stream_artist_month", ["artistId", "createdAt"])
@Index("idx_stream_user_month", ["userId", "createdAt"])
@Index("idx_stream_user_track_day", ["userId", "trackId", "createdAt"])
export class StreamEvent {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ name: "user_id", type: "int" })
  userId!: number;

  @Column({ name: "track_id", type: "int" })
  trackId!: number;

  @Column({ name: "artist_id", type: "int" })
  artistId!: number;

  @Column({ type: "enum", enum: StreamSource })
  source!: StreamSource;

  @Column({ name: "listen_duration_sec", type: "int" })
  listenDurationSec!: number;

  @Column({ name: "track_duration_sec", type: "int" })
  trackDurationSec!: number;

  @Column({
    name: "created_at",
    type: "datetime",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @ManyToOne(() => Track, { onDelete: "CASCADE" })
  @JoinColumn({ name: "track_id" })
  track!: Track;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "artist_id" })
  artist!: User;
}
