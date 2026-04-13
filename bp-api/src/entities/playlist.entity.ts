import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { PlaylistTrack } from "./playlist-track.entity";
import { User } from "./user.entity";

@Entity("Playlist")
export class Playlist {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ name: "user_id", type: "int" })
  userId!: number;

  @Column({ name: "is_public", type: "tinyint", width: 1, default: 0 })
  isPublic!: boolean;

  @Column({ name: "is_collaborative", type: "tinyint", width: 1, default: 0 })
  isCollaborative!: boolean;

  @Column({ name: "is_system", type: "tinyint", width: 1, default: 0 })
  isSystem!: boolean;

  @ManyToOne(() => User, { onDelete: "CASCADE", eager: false })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @OneToMany(() => PlaylistTrack, (pt) => pt.playlist, { cascade: true })
  playlistTracks!: PlaylistTrack[];

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
