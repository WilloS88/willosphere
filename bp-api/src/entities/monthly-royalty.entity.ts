import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from "typeorm";
import { User } from "./user.entity";

export enum RoyaltyTier {
  NONE = "none",
  NEW = "new",
  GROWING = "growing",
  EMERGING = "emerging",
}

@Entity("monthly_royalties")
@Unique("uk_artist_month", ["artistId", "month"])
export class MonthlyRoyalty {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ name: "artist_id", type: "int" })
  artistId!: number;

  @Column({ type: "date" })
  month!: string;

  @Column({ name: "base_payout", type: "decimal", precision: 12, scale: 2 })
  basePayout!: string;

  @Column({ name: "discovery_bonus", type: "decimal", precision: 12, scale: 2, default: 0 })
  discoveryBonus!: string;

  @Column({ name: "total_payout", type: "decimal", precision: 12, scale: 2 })
  totalPayout!: string;

  @Column({ name: "total_weighted_streams", type: "decimal", precision: 12, scale: 4 })
  totalWeightedStreams!: string;

  @Column({ name: "unique_listeners", type: "int" })
  uniqueListeners!: number;

  @Column({ type: "enum", enum: RoyaltyTier, default: RoyaltyTier.NONE })
  tier!: RoyaltyTier;

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

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "artist_id" })
  artist!: User;
}
