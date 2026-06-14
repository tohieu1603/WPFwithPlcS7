import "reflect-metadata";
import { DataSource } from "typeorm";
import { MachineState } from "./entities/MachineState";
import { ProductionRecord } from "./entities/ProductionRecord";
import { KpiSnapshot } from "./entities/KpiSnapshot";
import { AlarmLog } from "./entities/AlarmLog";
import { Recipe } from "./entities/Recipe";
import { StationState } from "./entities/StationState";

/**
 * PostgreSQL. The database runs in Docker (see docker-compose.yml); the backend
 * connects over TCP. Connection settings come from env vars, with defaults that
 * match the compose file so it works out of the box.
 */
export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER || "mes",
  password: process.env.DB_PASSWORD || "mes",
  database: process.env.DB_NAME || "mes",
  entities: [MachineState, ProductionRecord, KpiSnapshot, AlarmLog, Recipe, StationState],
  synchronize: true,
  logging: false,
});
