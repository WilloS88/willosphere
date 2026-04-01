import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { User } from "./user.entity";
import { Track } from "./track.entity";

@Entity("Listen_History")
@Index("idx_history_user_time", ["userId", "listenedAt"])
@Index("idx_history_track_time", ["trackId", "listenedAt"])
export class ListenHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "user_id", type: "int" })
  userId!: number;

  @Column({ name: "track_id", type: "int" })
  trackId!: number;

  @Column({
    name: "listened_at",
    type: "datetime",
    default: () => "CURRENT_TIMESTAMP",
  })
  listenedAt!: Date;

  @Column({ name: "device_info", type: "varchar", length: 255, nullable: true })
  deviceInfo?: string | null;

  @Column({ name: "seconds_played", type: "int", default: 0 })
  secondsPlayed!: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @ManyToOne(() => Track, { onDelete: "CASCADE" })
  @JoinColumn({ name: "track_id" })
  track!: Track;

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
