import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { transactionService } from "../services/transactionService";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get("/summary", async (_req, res, next) => {
  try {
    const summary = await transactionService.dashboardSummary();
    res.json(summary);
  } catch (err) {
    next(err);
  }
});
