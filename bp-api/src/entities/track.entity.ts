import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { TrackArtist } from "./track-artist.entity";
import { TrackGenre } from "./track-genre.entity";
import { Album } from "./album.entity";

@Entity("Track")
@Index("idx_track_title", ["title"])
export class Track {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ name: "duration_seconds", type: "int" })
  durationSeconds!: number;

  @Column({ type: "smallint", nullable: true })
  bpm?: number | null;

  @Column({ name: "audio_url", type: "varchar", length: 255 })
  audioUrl!: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  price?: string | null;

  @Column({ name: "cover_image_url", type: "varchar", length: 255, nullable: true })
  coverImageUrl?: string | null;

  @Column({ name: "album_id", type: "int", nullable: true })
  albumId?: number | null;

  @ManyToOne(() => Album, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "album_id" })
  album?: Album | null;

  @OneToMany(() => TrackArtist, (ta) => ta.track, { cascade: true })
  trackArtists!: TrackArtist[];

  @OneToMany(() => TrackGenre, (tg) => tg.track, { cascade: true })
  trackGenres!: TrackGenre[];

  @CreateDateColumn({
    name: "created_at",
    type: "datetime",
    precision: 0,
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "datetime",
    precision: 0,
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt!: Date;
}
