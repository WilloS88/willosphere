import {
  Entity, PrimaryGeneratedColumn, Column, Index,
  OneToMany, OneToOne, CreateDateColumn, UpdateDateColumn
} from "typeorm";
import { Exclude } from "class-transformer";
import { UserRole } from "./user-role.entity";
import { ArtistProfile } from "./artist-profile.entity";
import { RefreshToken } from "./refresh-token.entity";

@Entity("users")
@Index("uq_users_email", ["email"], { unique: true })
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  email!: string;

  @Exclude()
  @Column({
    name: "password_hash",
    type: "varchar",
    length: 255,
    select: false,
  })
  passwordHash!: string;

  @Column({ name: "display_name", type: "varchar", length: 255 })
  displayName!: string;

  @Column({ type: "varchar", length: 255, default: "UTC" })
  timezone!: string;

  @Column({ type: "varchar", length: 255, default: "en" })
  language!: string;

  @Column({ name: "profile_image_url", type: "varchar", length: 255, nullable: true })
  profileImageUrl?: string | null;

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

  @OneToMany(() => UserRole, (ur) => ur.user, { cascade: true })
  roles!: UserRole[];

  @OneToOne(() => ArtistProfile, (ap) => ap.user, { cascade: true })
  artistProfile?: ArtistProfile | null;

  @OneToMany(() => RefreshToken, (rt) => rt.user, { cascade: true })
  refreshTokens!: RefreshToken[];
}
