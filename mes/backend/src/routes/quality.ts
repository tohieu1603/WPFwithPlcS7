import { Router } from "express";
import { AppDataSource } from "../data-source";
import { ProductionRecord } from "../entities/ProductionRecord";

export const qualityRouter = Router();

/** Mean, sigma and 3-sigma control limits for an SPC chart. */
function spc(vals: number[]) {
  if (!vals.length) return { mean: 0, sigma: 0, ucl: 0, lcl: 0, min: 0, max: 0 };
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
  const sigma = Math.sqrt(variance);
  return {
    mean: round(mean), sigma: round(sigma),
    ucl: round(mean + 3 * sigma), lcl: round(mean - 3 * sigma),
    min: round(Math.min(...vals)), max: round(Math.max(...vals)),
  };
}
const round = (n: number) => Math.round(n * 1000) / 1000;

qualityRouter.get("/", async (req, res) => {
  const take = Math.min(500, Number(req.query.take) || 120);
  const recent = await AppDataSource.getRepository(ProductionRecord).find({
    order: { createdAt: "DESC" }, take,
  });
  const recs = recent.reverse();

  const scores = recs.filter((r) => r.visionScore > 0).map((r) => r.visionScore);
  const gaps = recs.filter((r) => r.gap > 0).map((r) => r.gap);
  const pass = recs.filter((r) => r.disposition === "PASS").length;

  const grade: Record<string, number> = {};
  for (const r of recs) grade[r.grade || "-"] = (grade[r.grade || "-"] || 0) + 1;

  const reason: Record<string, number> = {};
  for (const r of recs) if (r.disposition !== "PASS" && r.failReason) reason[r.failReason] = (reason[r.failReason] || 0) + 1;

  res.json({
    records: recs,
    count: recs.length,
    passRate: recs.length ? (pass / recs.length) * 100 : 0,
    score: spc(scores),
    gap: spc(gaps),
    gradeDist: Object.entries(grade).map(([g, count]) => ({ grade: g, count })).sort((a, b) => a.grade.localeCompare(b.grade)),
    pareto: Object.entries(reason).map(([r, count]) => ({ reason: r, count })).sort((a, b) => b.count - a.count),
  });
});
