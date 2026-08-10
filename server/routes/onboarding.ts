import { Router } from "express";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { requireAuth } from "../auth";
import { runOnboardingTurn, getOnboardingSnapshot } from "../onboarding";
import { storage } from "../storage";

export function createOnboardingRouter(): Router {
  const router = Router();
  router.use(requireAuth);

  router.get("/status", async (req, res) => {
    const snapshot = await getOnboardingSnapshot(req.session.userId!);
    res.json(snapshot);
  });

  router.post("/skip", async (req, res) => {
    const userId = req.session.userId!;
    await storage.updateUserSettings(userId, { onboardingCompleted: true });
    const snapshot = await getOnboardingSnapshot(userId);
    res.json(snapshot);
  });

  router.post("/message", async (req, res) => {
    const userId = req.session.userId!;
    const history: MessageParam[] = Array.isArray(req.body.messages) ? req.body.messages : [];
    const text: string | undefined = req.body.text;

    if (history.length === 0) {
      history.push({ role: "user", content: "[INIZIO]" });
    } else if (text && text.trim()) {
      history.push({ role: "user", content: text.trim() });
    } else if (history.length > 0 && text === undefined) {
      // riprendere una conversazione esistente senza nuovo messaggio non è supportato
      return res.status(400).json({ message: "Messaggio mancante" });
    }

    try {
      const result = await runOnboardingTurn(userId, history);
      const snapshot = await getOnboardingSnapshot(userId);
      res.json({ ...result, ...snapshot });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Errore dell'assistente";
      res.status(502).json({ message });
    }
  });

  return router;
}
