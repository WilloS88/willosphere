import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { AlbumArtist } from "./album-artist.entity";
import { Track } from "./track.entity";

@Entity("Album")
export class Album {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ name: "release_date", type: "date" })
  releaseDate!: string;

  @Column({ name: "cover_image_url", type: "varchar", length: 255 })
  coverImageUrl!: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price!: string;

  @OneToMany(() => AlbumArtist, (aa) => aa.album, { cascade: true })
  albumArtists!: AlbumArtist[];

  @OneToMany(() => Track, (t) => t.album)
  tracks!: Track[];

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
