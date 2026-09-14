import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { transactionLogEntrySchema } from "../utils/validators";

export const transactionLogRouter = Router();

transactionLogRouter.use(requireAuth);

transactionLogRouter.get("/", async (_req, res, next) => {
  try {
    const entries = await prisma.transactionLogEntry.findMany({
      orderBy: { date: "desc" },
    });
    res.json({ entries });
  } catch (error) {
    next(error);
  }
});

transactionLogRouter.post("/", requireRole("ADMIN", "OPERATOR"), async (req, res, next) => {
  try {
    const data = transactionLogEntrySchema.parse(req.body);
    const entry = await prisma.transactionLogEntry.create({
      data: { ...data, createdById: req.user!.sub },
    });
    res.status(201).json({ entry });
  } catch (error) {
    next(error);
  }
});

transactionLogRouter.delete("/:id", requireRole("ADMIN", "OPERATOR"), async (req, res, next) => {
  try {
    await prisma.transactionLogEntry.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});