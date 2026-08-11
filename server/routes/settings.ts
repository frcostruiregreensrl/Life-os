import { Router } from "express";
import { storage } from "../storage";
import { updateAvatarSchema } from "@shared/schema";
import { requireAuth } from "../auth";

export function createSettingsRouter(): Router {
  const router = Router();
  router.use(requireAuth);

  router.patch("/avatar", async (req, res) => {
    const parsed = updateAvatarSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message || "Dati non validi" });
    }
    const settings = await storage.updateUserSettings(req.session.userId!, parsed.data);
    res.json(settings);
  });

  return router;
}
