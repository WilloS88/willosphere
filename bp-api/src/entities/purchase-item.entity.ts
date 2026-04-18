import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from "typeorm";
import { Purchase } from "./purchase.entity";
import { Product } from "./product.entity";

@Entity("Purchase_Item")
@Index("idx_pi_purchase", ["purchaseId"])
@Index("idx_pi_product",  ["productId"])
export class PurchaseItem {
  @PrimaryColumn({ name: "purchase_id", type: "int" })
  purchaseId!: number;

  @PrimaryColumn({ name: "product_id", type: "int" })
  productId!: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price!: string;

  @ManyToOne(() => Purchase, (p) => p.items, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "purchase_id" })
  purchase!: Purchase;

  @ManyToOne(() => Product, (p) => p.purchaseItems, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "product_id" })
  product!: Product;

  @CreateDateColumn({
    name: "created_at",
    type: "datetime",
    precision: 0,
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;
}
