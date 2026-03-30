import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { User } from "./user.entity";

@Entity("mfa_challenge")
export class MfaChallenge {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ name: "user_id", type: "int" })
  userId!: number;

  @Column({ type: "varchar", length: 20, default: "LOGIN" })
  purpose!: string;

  @Column({ name: "expires_at", type: "datetime" })
  expiresAt!: Date;

  @Column({ type: "int", default: 0 })
  attempts!: number;

  @Column({ name: "verified_at", type: "datetime", nullable: true })
  verifiedAt?: Date | null;

  @CreateDateColumn({
    name: "created_at",
    type: "datetime",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user?: User;

  isExpired(): boolean {
    return this.expiresAt.getTime() <= Date.now();
  }

  isVerified(): boolean {
    return this.verifiedAt !== null && this.verifiedAt !== undefined;
  }
}
