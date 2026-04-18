import {
  Entity,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { Track } from "./track.entity";
import { Genre } from "./genre.entity";

@Entity("Track_Genre")
export class TrackGenre {
  @PrimaryColumn({ name: "track_id", type: "int" })
  trackId!: number;

  @PrimaryColumn({ name: "genre_id", type: "int" })
  genreId!: number;

  @CreateDateColumn({
    name: "created_at",
    type: "datetime",
    precision: 0,
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  @ManyToOne(() => Track, (t) => t.trackGenres, { onDelete: "CASCADE" })
  @JoinColumn({ name: "track_id" })
  track!: Track;

  @ManyToOne(() => Genre, (g) => g.trackGenres, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "genre_id" })
  genre!: Genre;
}
