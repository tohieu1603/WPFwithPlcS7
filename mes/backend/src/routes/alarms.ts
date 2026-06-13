import { Router } from "express";
import { AppDataSource } from "../data-source";
import { AlarmLog } from "../entities/AlarmLog";

export const alarmsRouter = Router();

alarmsRouter.get("/", async (req, res) => {
  const where: any = {};
  if (req.query.active === "true") where.active = true;
  const rows = await AppDataSource.getRepository(AlarmLog).find({
    where, order: { raisedAt: "DESC" }, take: 200,
  });
  res.json({ rows });
});
