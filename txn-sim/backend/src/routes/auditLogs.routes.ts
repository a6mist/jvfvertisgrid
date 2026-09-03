import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { auditService } from "../services/auditService";

export const auditLogsRouter = Router();

auditLogsRouter.use(requireAuth);

auditLogsRouter.get("/", async (req, res, next) => {
  try {
    const { protocolCode, eventType, page, pageSize } = req.query;
    const take = pageSize ? Number(pageSize) : 50;
    const skip = page ? (Number(page) - 1) * take : 0;

    const result = await auditService.list({
      protocolCode: protocolCode as string | undefined,
      eventType: eventType as string | undefined,
      take,
      skip,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});
