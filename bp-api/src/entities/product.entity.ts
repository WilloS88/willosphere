import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { ArtistProfile } from "./artist-profile.entity";
import { Track } from "./track.entity";
import { Album } from "./album.entity";
import { PurchaseItem } from "./purchase-item.entity";

@Entity("Product")
@Index("idx_product_artist", ["artistId"])
@Index("idx_product_track",  ["trackId"])
@Index("idx_product_album",  ["albumId"])
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "enum", enum: ["physical", "digital"], default: "digital" })
  type!: "physical" | "digital";

  @Column({ type: "text", nullable: true })
  description?: string | null;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price!: string;

  @Column({ name: "artist_id", type: "int" })
  artistId!: number;

  @Column({ name: "track_id", type: "int", nullable: true })
  trackId?: number | null;

  @Column({ name: "album_id", type: "int", nullable: true })
  albumId?: number | null;

  @ManyToOne(() => ArtistProfile, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "artist_id" })
  artist!: ArtistProfile;

  @ManyToOne(() => Track, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "track_id" })
  track?: Track | null;

  @ManyToOne(() => Album, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "album_id" })
  album?: Album | null;

  @OneToMany(() => PurchaseItem, (pi) => pi.product)
  purchaseItems!: PurchaseItem[];

  @CreateDateColumn({
    name: "created_at",
    type: "datetime",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "datetime",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt!: Date;
}
