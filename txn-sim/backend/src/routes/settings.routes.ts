import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";

export const settingsRouter = Router();

settingsRouter.use(requireAuth);

settingsRouter.get("/approval", async (_req, res, next) => {
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key: "approved_enabled" } });
    res.json({ approvedEnabled: setting?.value !== false });
  } catch (err) {
    next(err);
  }
});

settingsRouter.patch("/approval", requireRole("ADMIN", "OPERATOR"), async (req, res, next) => {
  try {
    if (typeof req.body?.approvedEnabled !== "boolean") {
      return res.status(422).json({ error: "approvedEnabled must be a boolean." });
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key: "approved_enabled" },
      create: { key: "approved_enabled", value: req.body.approvedEnabled },
      update: { value: req.body.approvedEnabled },
    });

    res.json({ approvedEnabled: setting.value === true });
  } catch (err) {
    next(err);
  }
});