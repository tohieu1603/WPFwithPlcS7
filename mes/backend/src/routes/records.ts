import { Router } from "express";
import { Like } from "typeorm";
import { AppDataSource } from "../data-source";
import { ProductionRecord } from "../entities/ProductionRecord";

export const recordsRouter = Router();

recordsRouter.get("/", async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Number(req.query.pageSize) || 20);
  const where: any = {};
  if (req.query.disposition) where.disposition = String(req.query.disposition);
  if (req.query.search) where.serial = Like(`%${String(req.query.search)}%`);

  const [rows, total] = await AppDataSource.getRepository(ProductionRecord).findAndCount({
    where, order: { createdAt: "DESC" },
    skip: (page - 1) * pageSize, take: pageSize,
  });
  res.json({ rows, total, page, pageSize });
});

/** Full genealogy of one unit: the record plus a per-station timeline. */
recordsRouter.get("/:serial", async (req, res) => {
  const rec = await AppDataSource.getRepository(ProductionRecord).findOne({
    where: { serial: req.params.serial }, order: { createdAt: "DESC" },
  });
  if (!rec) return res.status(404).json({ error: "not found" });

  const pass = rec.disposition === "PASS";
  const timeline = [
    { code: "ST10", name: "Infeed", status: "done", detail: "Unit entered the line" },
    { code: "ST20", name: "Identify", status: rec.barcode ? "done" : "fail", detail: rec.barcode ? `Barcode ${rec.barcode}` : "No-read" },
    { code: "ST30", name: "Assembly", status: "done", detail: "Pressed and screwed" },
    { code: "ST40", name: "Vision", status: rec.visionPass ? "done" : "fail", detail: `Score ${rec.visionScore.toFixed(1)}% · gap ${rec.gap.toFixed(3)}mm · bore ${rec.bore.toFixed(3)}mm` },
    { code: "ST50", name: "Marking", status: "done", detail: `Serial ${rec.serial}` },
    { code: "ST60", name: "Verify", status: rec.grade ? "done" : "warn", detail: `Print grade ${rec.grade || "-"}` },
    { code: pass ? "ST80" : "ST70", name: pass ? "Outfeed" : "Reject", status: pass ? "done" : "fail", detail: rec.disposition + (rec.failReason ? ` (${rec.failReason})` : "") },
  ];
  res.json({ record: rec, timeline });
});
