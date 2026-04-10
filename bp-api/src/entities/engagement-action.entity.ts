import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./user.entity";

export enum EngagementActionType {
  LIKE_TRACK = "like_track",
  SAVE_TO_LIBRARY = "save_to_library",
  ADD_TO_PLAYLIST = "add_to_playlist",
  SHARE_TRACK = "share_track",
  FOLLOW_ARTIST = "follow_artist",
  PURCHASE_MERCH = "purchase_merch",
}

@Entity("engagement_actions")
@Index("idx_engage_user_artist_month", ["userId", "artistId", "createdAt"])
@Index("idx_engage_user_action", ["userId", "actionType", "createdAt"])
export class EngagementAction {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ name: "user_id", type: "int" })
  userId!: number;

  @Column({ name: "artist_id", type: "int" })
  artistId!: number;

  @Column({ name: "track_id", type: "int", nullable: true })
  trackId?: number | null;

  @Column({
    name: "action_type",
    type: "enum",
    enum: EngagementActionType,
  })
  actionType!: EngagementActionType;

  @Column({
    name: "created_at",
    type: "datetime",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "artist_id" })
  artist!: User;
}
