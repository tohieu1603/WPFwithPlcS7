import "reflect-metadata";
import { DataSource } from "typeorm";
import { MachineState } from "./entities/MachineState";
import { ProductionRecord } from "./entities/ProductionRecord";
import { KpiSnapshot } from "./entities/KpiSnapshot";
import { AlarmLog } from "./entities/AlarmLog";
import { Recipe } from "./entities/Recipe";
import { StationState } from "./entities/StationState";

/**
 * SQLite via sql.js (WASM) so the backend runs with no native build and no DB server.
 * The database is persisted to data/mes.sqlite (autoSave after each transaction).
 */
export const AppDataSource = new DataSource({
  type: "sqljs",
  autoSave: true,
  location: "data/mes.sqlite",
  entities: [MachineState, ProductionRecord, KpiSnapshot, AlarmLog, Recipe, StationState],
  synchronize: true,
  logging: false,
});
