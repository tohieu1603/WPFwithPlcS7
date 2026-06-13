import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";

/** Alarm raise/clear events reported by the HMI. */
@Entity()
export class AlarmLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar")
  name!: string;

  @Column("varchar")
  priority!: string;

  @Column("varchar")
  station!: string;

  @Column("varchar", { default: "" })
  description!: string;

  @Index()
  @Column("boolean", { default: true })
  active!: boolean;

  @CreateDateColumn()
  raisedAt!: Date;
}
