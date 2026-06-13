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
