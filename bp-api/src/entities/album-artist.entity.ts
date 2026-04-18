import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { Album } from "./album.entity";
import { ArtistProfile } from "./artist-profile.entity";

@Entity("Album_Artist")
export class AlbumArtist {
  @PrimaryColumn({ name: "album_id", type: "int" })
  albumId!: number;

  @PrimaryColumn({ name: "artist_id", type: "int" })
  artistId!: number;

  @Column({ type: "enum", enum: ["primary", "collaborator"] })
  role!: "primary" | "collaborator";

  @CreateDateColumn({
    name: "created_at",
    type: "datetime",
    precision: 0,
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  @ManyToOne(() => Album, (a) => a.albumArtists, { onDelete: "CASCADE" })
  @JoinColumn({ name: "album_id" })
  album!: Album;

  @ManyToOne(() => ArtistProfile, { onDelete: "CASCADE", eager: false })
  @JoinColumn({ name: "artist_id" })
  artist!: ArtistProfile;
}
