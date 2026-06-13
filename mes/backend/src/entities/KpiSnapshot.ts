import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

/** Periodic snapshot of the production counters, used for live KPI and history charts. */
@Entity()
export class KpiSnapshot {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("int", { default: 0 })
  good!: number;

  @Column("int", { default: 0 })
  reject!: number;

  @Column("int", { default: 0 })
  total!: number;

  @Column("float", { default: 0 })
  fpy!: number;

  @Column("float", { default: 0 })
  throughput!: number;

  @Column("int", { default: 0 })
  rejVision!: number;

  @Column("int", { default: 0 })
  rejBarcode!: number;

  @Column("int", { default: 0 })
  rejVerify!: number;

  @Column("int", { default: 0 })
  rejAssembly!: number;

  @Column("int", { default: 0 })
  runtime!: number;

  @Column("int", { default: 0 })
  downtime!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
