import { Entity, PrimaryColumn, Column, UpdateDateColumn } from "typeorm";

/** Latest status of one line station, upserted by code (ST10..ST80). */
@Entity()
export class StationState {
  @PrimaryColumn("varchar")
  code!: string;

  @Column("varchar")
  name!: string;

  @Column("varchar", { default: "IDLE" })
  status!: string; // RUN | IDLE | FAULT

  @Column("boolean", { default: false })
  fault!: boolean;

  @Column("int", { default: 0 })
  count!: number;

  @Column("float", { default: 0 })
  cycleTime!: number;

  @UpdateDateColumn()
  updatedAt!: Date;
}
