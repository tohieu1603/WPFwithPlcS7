import { Router } from "express";
import { AppDataSource } from "../data-source";
import { MachineState } from "../entities/MachineState";
import { ProductionRecord } from "../entities/ProductionRecord";
import { KpiSnapshot } from "../entities/KpiSnapshot";
import { AlarmLog } from "../entities/AlarmLog";
import { StationState } from "../entities/StationState";

/** Endpoints the HMI posts to. This is the line -> MES boundary. */
export const ingestRouter = Router();

// Per-station status (upsert by code)
ingestRouter.post("/stations", async (req, res) => {
  const repo = AppDataSource.getRepository(StationState);
  const arr: any[] = Array.isArray(req.body?.stations) ? req.body.stations : [];
  for (const st of arr) {
    if (!st.code) continue;
    let row = await repo.findOneBy({ code: st.code });
    row = row ?? repo.create({ code: st.code });
    row.name = st.name ?? row.name ?? st.code;
    row.status = st.status ?? "IDLE";
    row.fault = !!st.fault;
    row.count = st.count ?? 0;
    row.cycleTime = st.cycleTime ?? 0;
    await repo.save(row);
  }
  res.json({ ok: true, count: arr.length });
});

// Latest machine state (single upserted row id = 1)
ingestRouter.post("/state", async (req, res) => {
  const repo = AppDataSource.getRepository(MachineState);
  const b = req.body ?? {};
  let row = await repo.findOneBy({ id: 1 });
  row = row ?? repo.create({ id: 1 });
  row.state = b.state ?? row.state;
  row.mode = b.mode ?? row.mode;
  row.running = !!b.running;
  row.lineRate = Number(b.lineRate ?? 0);
  row.airPressure = Number(b.airPressure ?? 0);
  row.activeAlarms = Number(b.activeAlarms ?? 0);
  await repo.save(row);
  res.json({ ok: true });
});

// KPI snapshot (kept as history; latest = newest)
ingestRouter.post("/kpi", async (req, res) => {
  const repo = AppDataSource.getRepository(KpiSnapshot);
  const b = req.body ?? {};
  await repo.save(repo.create({
    good: b.good ?? 0, reject: b.reject ?? 0, total: b.total ?? 0,
    fpy: b.fpy ?? 0, throughput: b.throughput ?? 0,
    rejVision: b.rejVision ?? 0, rejBarcode: b.rejBarcode ?? 0,
    rejVerify: b.rejVerify ?? 0, rejAssembly: b.rejAssembly ?? 0,
    runtime: b.runtime ?? 0, downtime: b.downtime ?? 0,
  }));
  res.json({ ok: true });
});

// One finished unit (traceability)
ingestRouter.post("/record", async (req, res) => {
  const repo = AppDataSource.getRepository(ProductionRecord);
  const b = req.body ?? {};
  if (!b.serial) return res.status(400).json({ error: "serial required" });
  await repo.save(repo.create({
    serial: b.serial, product: b.product ?? "", barcode: b.barcode ?? "",
    visionPass: !!b.visionPass, visionScore: b.visionScore ?? 0,
    gap: b.gap ?? 0, bore: b.bore ?? 0, grade: b.grade ?? "",
    disposition: b.disposition ?? "FAIL", failReason: b.failReason ?? "",
  }));
  res.json({ ok: true });
});

// Sync the active-alarm set: clear ones gone, open new ones (keeps a log).
ingestRouter.post("/alarms", async (req, res) => {
  const repo = AppDataSource.getRepository(AlarmLog);
  const incoming: any[] = Array.isArray(req.body?.active) ? req.body.active : [];
  const names = incoming.map((a) => a.name);

  const current = await repo.findBy({ active: true });
  for (const row of current) {
    if (!names.includes(row.name)) { row.active = false; row.clearedAt = new Date(); await repo.save(row); }
  }
  for (const a of incoming) {
    const exists = current.find((c) => c.name === a.name && c.active);
    if (!exists) {
      await repo.save(repo.create({
        name: a.name, priority: a.priority ?? "LOW",
        station: a.station ?? "LINE", description: a.description ?? "", active: true,
      }));
    }
  }
  res.json({ ok: true, active: names.length });
});
