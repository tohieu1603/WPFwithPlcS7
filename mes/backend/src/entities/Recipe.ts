import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from "typeorm";

/** Product recipe managed from the web UI. */
@Entity()
export class Recipe {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("int", { unique: true })
  number!: number;

  @Column("varchar")
  name!: string;

  @Column("float", { default: 0.5 })
  gapNominal!: number;

  @Column("float", { default: 0.1 })
  gapTol!: number;

  @Column("float", { default: 90 })
  visionMinScore!: number;

  @Column("float", { default: 1200 })
  pressForce!: number;

  @Column("float", { default: 2.5 })
  screwTorque!: number;

  @Column("float", { default: 30 })
  cycleTarget!: number;

  @Column("int", { default: 2 })
  barcodeMinGrade!: number;

  @UpdateDateColumn()
  updatedAt!: Date;
}
