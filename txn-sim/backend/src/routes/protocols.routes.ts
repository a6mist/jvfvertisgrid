import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { protocolRepository } from "../services/protocolRepository";
import { protocolDefinitionUpdateSchema } from "../utils/validators";
import { SIMULATOR_CLASSIFICATION_LABEL } from "../protocols/definitions";

export const protocolsRouter = Router();

protocolsRouter.use(requireAuth);

protocolsRouter.get("/", async (_req, res, next) => {
  try {
    const protocols = await protocolRepository.listAll();
    res.json({ protocols, classificationLabel: SIMULATOR_CLASSIFICATION_LABEL });
  } catch (err) {
    next(err);
  }
});

protocolsRouter.get("/:code", async (req, res, next) => {
  try {
    const protocol = await protocolRepository.findByCode(req.params.code);
    res.json({ protocol });
  } catch (err) {
    next(err);
  }
});

protocolsRouter.patch("/:code", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const data = protocolDefinitionUpdateSchema.parse(req.body);
    const protocol = await protocolRepository.update(req.params.code, data);
    res.json({ protocol });
  } catch (err) {
    next(err);
  }
});
