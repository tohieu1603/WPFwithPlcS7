import { Router } from "express";
import { AppDataSource } from "../data-source";
import { AlarmLog } from "../entities/AlarmLog";

export const alarmsRouter = Router();

// Summary: active counts by priority, events by station, mean active duration.
alarmsRouter.get("/stats", async (_req, res) => {
  const all = await AppDataSource.getRepository(AlarmLog).find({
    order: { raisedAt: "DESC" }, take: 500,
  });
  const active = all.filter((a) => a.active);

  const byPriority: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const a of active) byPriority[a.priority] = (byPriority[a.priority] || 0) + 1;

  const byStation: Record<string, number> = {};
  for (const a of all) byStation[a.station] = (byStation[a.station] || 0) + 1;

  const durations = all
    .filter((a) => !a.active && a.clearedAt)
    .map((a) => (new Date(a.clearedAt as Date).getTime() - new Date(a.raisedAt).getTime()) / 1000)
    .filter((d) => d >= 0);
  const avgDurationSec = durations.length ? durations.reduce((x, y) => x + y, 0) / durations.length : 0;

  res.json({
    activeCount: active.length,
    totalEvents: all.length,
    byPriority,
    byStation: Object.entries(byStation).map(([station, count]) => ({ station, count })).sort((a, b) => b.count - a.count),
    avgDurationSec: Math.round(avgDurationSec),
  });
});

// Downtime Pareto: total seconds lost per cause (cleared alarms with a duration).
alarmsRouter.get("/downtime", async (_req, res) => {
  const all = await AppDataSource.getRepository(AlarmLog).find({
    order: { raisedAt: "DESC" }, take: 1000,
  });
  const map = new Map<string, { cause: string; station: string; downtimeSec: number; count: number }>();
  for (const a of all) {
    if (a.active || !a.clearedAt) continue;
    const sec = (new Date(a.clearedAt).getTime() - new Date(a.raisedAt).getTime()) / 1000;
    if (sec < 0) continue;
    const key = a.description || a.name;
    const e = map.get(key) ?? { cause: key, station: a.station, downtimeSec: 0, count: 0 };
    e.downtimeSec += sec;
    e.count++;
    map.set(key, e);
  }
  const rows = [...map.values()]
    .map((e) => ({ ...e, downtimeSec: Math.round(e.downtimeSec) }))
    .sort((a, b) => b.downtimeSec - a.downtimeSec);
  res.json({ rows });
});

alarmsRouter.get("/", async (req, res) => {
  const where: any = {};
  if (req.query.active === "true") where.active = true;
  if (req.query.priority) where.priority = String(req.query.priority);
  if (req.query.station) where.station = String(req.query.station);
  const rows = await AppDataSource.getRepository(AlarmLog).find({
    where, order: { raisedAt: "DESC" }, take: 200,
  });
  res.json({ rows });
});
