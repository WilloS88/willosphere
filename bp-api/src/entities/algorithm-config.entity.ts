import {
  Entity,
  Column,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("algorithm_config")
export class AlgorithmConfig {
  @PrimaryColumn({ name: "param_key", type: "varchar", length: 50 })
  paramKey!: string;

  @Column({ name: "param_value", type: "decimal", precision: 10, scale: 4 })
  paramValue!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  description?: string | null;

  @UpdateDateColumn({
    name: "updated_at",
    type: "datetime",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt!: Date;
}
