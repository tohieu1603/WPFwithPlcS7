import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";

/** One traceability record per unit that left the line (PASS or FAIL). */
@Entity()
export class ProductionRecord {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column("varchar")
  serial!: string;

  @Column("varchar")
  product!: string;

  @Column("varchar", { default: "" })
  barcode!: string;

  @Column("boolean", { default: false })
  visionPass!: boolean;

  @Column("float", { default: 0 })
  visionScore!: number;

  @Column("float", { default: 0 })
  gap!: number;

  @Column("float", { default: 0 })
  bore!: number;

  @Column("varchar", { default: "" })
  grade!: string;

  @Index()
  @Column("varchar")
  disposition!: string; // PASS | FAIL | REWORK

  @Column("varchar", { default: "" })
  failReason!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
