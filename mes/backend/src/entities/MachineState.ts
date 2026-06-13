import { Entity, PrimaryColumn, Column, UpdateDateColumn } from "typeorm";

/** Latest machine state, kept as a single upserted row (id = 1). */
@Entity()
export class MachineState {
  @PrimaryColumn("int")
  id!: number; // always 1

  @Column("varchar", { default: "STOPPED" })
  state!: string;

  @Column("varchar", { default: "PRODUCTION" })
  mode!: string;

  @Column("boolean", { default: false })
  running!: boolean;

  @Column("float", { default: 0 })
  lineRate!: number;

  @Column("float", { default: 0 })
  airPressure!: number;

  @Column("int", { default: 0 })
  activeAlarms!: number;

  @UpdateDateColumn()
  updatedAt!: Date;
}
