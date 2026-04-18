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
import { User } from "./user.entity";
import { PurchaseItem } from "./purchase-item.entity";

@Entity("Purchase")
@Index("idx_purchase_user_time", ["userId", "purchaseDate"])
export class Purchase {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "user_id", type: "int" })
  userId!: number;

  @Column({
    name: "purchase_date",
    type: "datetime",
    precision: 0,
    default: () => "CURRENT_TIMESTAMP",
  })
  purchaseDate!: Date;

  @Column({ name: "total_price", type: "decimal", precision: 10, scale: 2 })
  totalPrice!: string;

  @Column({ name: "currency_code", type: "char", length: 3, default: "CZK" })
  currencyCode!: string;

  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @OneToMany(() => PurchaseItem, (pi) => pi.purchase, { cascade: true })
  items!: PurchaseItem[];

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
