import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { User } from "./user.entity";

@Entity("refresh_tokens")
@Index("uq_refresh_tokens_token_hash", ["tokenHash"], { unique: true })
@Index("idx_refresh_tokens_user_id", ["userId"])
@Index("idx_refresh_tokens_expires_at", ["expiresAt"])
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "user_id", type: "int" })
  userId!: number;

  @Column({ name: "device_id", type: "varchar", length: 255 })
  deviceId!: string;

  @Column({ name: "token_hash", type: "varchar", length: 255 })
  tokenHash!: string;

  @Column({ name: "expires_at", type: "datetime" })
  expiresAt!: Date;

  @Column({ name: "revoked_at", type: "datetime", nullable: true })
  revokedAt?: Date | null;

  @Column({ name: "replaced_by_hash", type: "varchar", length: 255, nullable: true })
  replacedByHash?: string | null;

  @CreateDateColumn({
    name: "created_at",
    type: "datetime",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user?: User;
}
