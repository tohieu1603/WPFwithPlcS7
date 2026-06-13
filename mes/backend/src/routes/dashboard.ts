import { Router } from "express";
import { AppDataSource } from "../data-source";
import { MachineState } from "../entities/MachineState";
import { KpiSnapshot } from "../entities/KpiSnapshot";
import { ProductionRecord } from "../entities/ProductionRecord";
import { AlarmLog } from "../entities/AlarmLog";
import { StationState } from "../entities/StationState";

export const dashboardRouter = Router();

const TARGET_PPH = 360; // nominal line rate for the performance term

function computeOee(kpi: KpiSnapshot | null) {
  if (!kpi) return { availability: 0, performance: 0, quality: 0, overall: 0 };
  const up = kpi.runtime + kpi.downtime;
  const availability = up > 0 ? (kpi.runtime / up) * 100 : 0;
  const performance = Math.min(100, (kpi.throughput / TARGET_PPH) * 100);
  const quality = kpi.total > 0 ? (kpi.good / kpi.total) * 100 : 100;
  const overall = (availability * performance * quality) / 10000;
  return {
    availability: Math.round(availability),
    performance: Math.round(performance),
    quality: Math.round(quality),
    overall: Math.round(overall),
  };
}

dashboardRouter.get("/", async (_req, res) => {
  const state = await AppDataSource.getRepository(MachineState).findOneBy({ id: 1 });
  const kpi = await AppDataSource.getRepository(KpiSnapshot).findOne({
    where: {}, order: { createdAt: "DESC" },
  });
  const recentRecords = await AppDataSource.getRepository(ProductionRecord).find({
    order: { createdAt: "DESC" }, take: 8,
  });
  const activeAlarms = await AppDataSource.getRepository(AlarmLog).find({
    where: { active: true }, order: { raisedAt: "DESC" },
  });
  const stations = await AppDataSource.getRepository(StationState).find({ order: { code: "ASC" } });
  res.json({ state, kpi, recentRecords, activeAlarms, stations, oee: computeOee(kpi) });
});

dashboardRouter.get("/stations", async (_req, res) => {
  const rows = await AppDataSource.getRepository(StationState).find({ order: { code: "ASC" } });
  res.json({ rows });
});

// KPI history for charts (most recent N, returned oldest-first)
dashboardRouter.get("/kpi-history", async (req, res) => {
  const take = Math.min(500, Number(req.query.take) || 60);
  const rows = await AppDataSource.getRepository(KpiSnapshot).find({
    order: { createdAt: "DESC" }, take,
  });
  res.json({ rows: rows.reverse() });
});
