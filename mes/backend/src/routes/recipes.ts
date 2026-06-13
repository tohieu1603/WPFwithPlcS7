import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Recipe } from "../entities/Recipe";

export const recipesRouter = Router();
const repo = () => AppDataSource.getRepository(Recipe);

recipesRouter.get("/", async (_req, res) => {
  res.json({ rows: await repo().find({ order: { number: "ASC" } }) });
});

recipesRouter.post("/", async (req, res) => {
  const b = req.body ?? {};
  if (b.number == null || !b.name) return res.status(400).json({ error: "number and name required" });
  try {
    const saved = await repo().save(repo().create({
      number: Number(b.number), name: String(b.name),
      gapNominal: Number(b.gapNominal ?? 0.5), gapTol: Number(b.gapTol ?? 0.1),
      visionMinScore: Number(b.visionMinScore ?? 90), pressForce: Number(b.pressForce ?? 1200),
      screwTorque: Number(b.screwTorque ?? 2.5), cycleTarget: Number(b.cycleTarget ?? 30),
      barcodeMinGrade: Number(b.barcodeMinGrade ?? 2),
    }));
    res.json(saved);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

recipesRouter.put("/:id", async (req, res) => {
  const row = await repo().findOneBy({ id: Number(req.params.id) });
  if (!row) return res.status(404).json({ error: "not found" });
  Object.assign(row, req.body ?? {});
  res.json(await repo().save(row));
});

recipesRouter.delete("/:id", async (req, res) => {
  await repo().delete({ id: Number(req.params.id) });
  res.json({ ok: true });
});
