import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./user.entity";
import { Role } from "./role.enum";

@Entity("user_role")
@Index("pk_user_role", ["userId", "role"], { unique: true })
export class UserRole {
  @PrimaryColumn({ name: "user_id", type: "int" })
  userId!: number;

  @PrimaryColumn({ type: "enum", enum: Role })
  role!: Role;

  @Column({
    name: "assigned_at",
    type: "datetime",
    precision: 0,
    default: () => "CURRENT_TIMESTAMP",
  })
  assignedAt!: Date;

  @ManyToOne(() => User, (u) => u.roles, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;
}
