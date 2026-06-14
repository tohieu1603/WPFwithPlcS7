import "reflect-metadata";
import express from "express";
import cors from "cors";
import { AppDataSource } from "./data-source";
import { Recipe } from "./entities/Recipe";
import { ingestRouter } from "./routes/ingest";
import { dashboardRouter } from "./routes/dashboard";
import { recordsRouter } from "./routes/records";
import { alarmsRouter } from "./routes/alarms";
import { recipesRouter } from "./routes/recipes";
import { qualityRouter } from "./routes/quality";
import { genealogyRouter } from "./routes/genealogy";

const PORT = Number(process.env.PORT || 4000);

async function seedRecipes() {
  const repo = AppDataSource.getRepository(Recipe);
  if ((await repo.count()) > 0) return;
  await repo.save([
    repo.create({ number: 1, name: "MODEL-A", gapNominal: 0.5, gapTol: 0.1, visionMinScore: 90, pressForce: 1200, screwTorque: 2.5, cycleTarget: 30, barcodeMinGrade: 2 }),
    repo.create({ number: 2, name: "MODEL-B", gapNominal: 0.6, gapTol: 0.12, visionMinScore: 92, pressForce: 1500, screwTorque: 3.0, cycleTarget: 28, barcodeMinGrade: 2 }),
    repo.create({ number: 3, name: "MODEL-C", gapNominal: 0.45, gapTol: 0.08, visionMinScore: 88, pressForce: 900, screwTorque: 2.0, cycleTarget: 35, barcodeMinGrade: 2 }),
  ]);
  console.log("Seeded 3 recipes");
}

async function main() {
  await AppDataSource.initialize();
  await seedRecipes();

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));
  app.use("/api/ingest", ingestRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/records", recordsRouter);
  app.use("/api/alarms", alarmsRouter);
  app.use("/api/recipes", recipesRouter);
  app.use("/api/quality", qualityRouter);
  app.use("/api/genealogy", genealogyRouter);

  app.listen(PORT, () => console.log(`MES backend listening on http://localhost:${PORT}`));
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
