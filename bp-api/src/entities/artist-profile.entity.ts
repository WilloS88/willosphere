import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./user.entity";

@Entity("ArtistProfile")
export class ArtistProfile {
  @PrimaryColumn({ name: "user_id", type: "int" })
  userId!: number;

  @Column({ type: "text", nullable: true })
  bio?: string | null;

  @Column({
    name: "banner_image_url",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  bannerImageUrl?: string | null;

  @Column({ name: "artist_since", type: "date", nullable: true })
  artistSince?: string | null;

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

  @OneToOne(() => User, (u) => u.artistProfile, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;
}
