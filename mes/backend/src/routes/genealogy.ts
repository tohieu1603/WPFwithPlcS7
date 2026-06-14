import { Router } from "express";
import { AppDataSource } from "../data-source";
import { ProductionRecord } from "../entities/ProductionRecord";

/** Bidirectional traceability: where-used (forward) — every unit built from a given
 * product/recipe — for containment and recall. (Backward, as-built, is /records/:serial.) */
export const genealogyRouter = Router();

// Distinct products with their unit counts (drives the where-used selector).
genealogyRouter.get("/products", async (_req, res) => {
  const raw = await AppDataSource.getRepository(ProductionRecord)
    .createQueryBuilder("r")
    .select("r.product", "product")
    .addSelect("COUNT(*)", "count")
    .groupBy("r.product")
    .orderBy("count", "DESC")
    .getRawMany();
  res.json({ rows: raw.map((r) => ({ product: r.product, count: Number(r.count) })) });
});

// Every unit that used the given product (or all), with a pass/fail summary.
genealogyRouter.get("/where-used", async (req, res) => {
  const where: any = {};
  if (req.query.product) where.product = String(req.query.product);
  if (req.query.barcode) where.barcode = String(req.query.barcode);

  const units = await AppDataSource.getRepository(ProductionRecord).find({
    where, order: { createdAt: "DESC" }, take: 500,
  });
  const pass = units.filter((u) => u.disposition === "PASS").length;
  const fail = units.filter((u) => u.disposition === "FAIL").length;
  res.json({ units, total: units.length, pass, fail, rework: units.length - pass - fail });
});
