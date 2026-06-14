import { Router } from "express";
import { AppDataSource } from "../data-source";
import { MachineState } from "../entities/MachineState";
import { KpiSnapshot } from "../entities/KpiSnapshot";
import { ProductionRecord } from "../entities/ProductionRecord";
import { AlarmLog } from "../entities/AlarmLog";
import { StationState } from "../entities/StationState";

export const dashboardRouter = Router();

const TARGET_PPH = 360; // nominal line rate for the performance term

const SHIFTS = ["Ca 1 (06-14h)", "Ca 2 (14-22h)", "Ca 3 (22-06h)"];
function shiftOf(d: Date): number {
  const h = new Date(d).getHours();
  if (h >= 6 && h < 14) return 0;
  if (h >= 14 && h < 22) return 1;
  return 2;
}

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

// OEE averaged per work shift (shift derived from each snapshot's timestamp)
dashboardRouter.get("/oee-by-shift", async (req, res) => {
  const take = Math.min(5000, Number(req.query.take) || 1000);
  const rows = await AppDataSource.getRepository(KpiSnapshot).find({
    order: { createdAt: "DESC" }, take,
  });
  const agg = SHIFTS.map((shift) => ({ shift, a: 0, p: 0, q: 0, o: 0, tp: 0, n: 0 }));
  for (const k of rows) {
    const up = k.runtime + k.downtime;
    const availability = up > 0 ? (k.runtime / up) * 100 : 0;
    const performance = Math.min(100, (k.throughput / TARGET_PPH) * 100);
    const quality = k.total > 0 ? (k.good / k.total) * 100 : 100;
    const g = agg[shiftOf(k.createdAt)];
    g.a += availability; g.p += performance; g.q += quality;
    g.o += (availability * performance * quality) / 10000; g.tp += k.throughput; g.n++;
  }
  const out = agg.map((g) => ({
    shift: g.shift,
    availability: g.n ? Math.round(g.a / g.n) : 0,
    performance: g.n ? Math.round(g.p / g.n) : 0,
    quality: g.n ? Math.round(g.q / g.n) : 0,
    overall: g.n ? Math.round(g.o / g.n) : 0,
    throughput: g.n ? Math.round(g.tp / g.n) : 0,
    samples: g.n,
  }));
  res.json({ rows: out });
});

// OEE computed per snapshot, as a time series for the dashboard trend
dashboardRouter.get("/oee-history", async (req, res) => {
  const take = Math.min(500, Number(req.query.take) || 60);
  const rows = await AppDataSource.getRepository(KpiSnapshot).find({
    order: { createdAt: "DESC" }, take,
  });
  const out = rows.reverse().map((k) => {
    const up = k.runtime + k.downtime;
    const availability = up > 0 ? (k.runtime / up) * 100 : 0;
    const performance = Math.min(100, (k.throughput / TARGET_PPH) * 100);
    const quality = k.total > 0 ? (k.good / k.total) * 100 : 100;
    return {
      t: k.createdAt,
      availability: Math.round(availability),
      performance: Math.round(performance),
      quality: Math.round(quality),
      overall: Math.round((availability * performance * quality) / 10000),
    };
  });
  res.json({ rows: out });
});
