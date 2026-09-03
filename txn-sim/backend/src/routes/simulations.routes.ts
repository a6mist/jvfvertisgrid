import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { createSimulationSchema, assertNoForbiddenFields } from "../utils/validators";
import { simulationService } from "../services/simulationService";
import { verificationService } from "../services/verificationService";
import { transactionService } from "../services/transactionService";

export const simulationsRouter = Router();

simulationsRouter.use(requireAuth);

simulationsRouter.post("/", requireRole("ADMIN", "OPERATOR"), async (req, res, next) => {
  try {
    assertNoForbiddenFields(req.body);
    const data = createSimulationSchema.parse(req.body);
    const simulation = await simulationService.create(data, req.user!.sub);
    res.status(201).json({ simulation });
  } catch (err) {
    next(err);
  }
});

simulationsRouter.get("/", async (req, res, next) => {
  try {
    const { protocolCode, network, status, search, dateFrom, dateTo, page, pageSize, sortBy, sortDir } = req.query;
    const take = pageSize ? Number(pageSize) : 25;
    const skip = page ? (Number(page) - 1) * take : 0;

    const result = await transactionService.list({
      protocolCode: protocolCode as string | undefined,
      network: network as "VISA" | "MASTERCARD" | undefined,
      status: status as any,
      search: search as string | undefined,
      dateFrom: dateFrom as string | undefined,
      dateTo: dateTo as string | undefined,
      take,
      skip,
      sortBy: sortBy as any,
      sortDir: sortDir as any,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

simulationsRouter.get("/:id", async (req, res, next) => {
  try {
    const simulation = await transactionService.findById(req.params.id);
    res.json({ simulation });
  } catch (err) {
    next(err);
  }
});

simulationsRouter.post("/:id/verify", requireRole("ADMIN", "OPERATOR"), async (req, res, next) => {
  try {
    const simulation = await verificationService.verify(req.params.id, req.user!.sub);
    res.json({ simulation });
  } catch (err) {
    next(err);
  }
});
