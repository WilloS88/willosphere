import {
  Entity,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { Track } from "./track.entity";
import { ArtistProfile } from "./artist-profile.entity";

@Entity("Track_Artist")
export class TrackArtist {
  @PrimaryColumn({ name: "track_id", type: "int" })
  trackId!: number;

  @PrimaryColumn({ name: "artist_id", type: "int" })
  artistId!: number;

  @PrimaryColumn({ type: "enum", enum: ["primary", "feat"] })
  role!: "primary" | "feat";

  @CreateDateColumn({
    name: "created_at",
    type: "datetime",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  @ManyToOne(() => Track, (t) => t.trackArtists, { onDelete: "CASCADE" })
  @JoinColumn({ name: "track_id" })
  track!: Track;

  @ManyToOne(() => ArtistProfile, { onDelete: "CASCADE", eager: false })
  @JoinColumn({ name: "artist_id" })
  artist!: ArtistProfile;
}
