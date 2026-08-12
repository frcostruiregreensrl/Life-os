import { Router } from "express";
import { requireAuth } from "../auth";

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech";
// "Rachel" — multilingual preset voice, sounds natural in Italian with eleven_multilingual_v2
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";
const MAX_TEXT_LENGTH = 2000;

export function createSpeechRouter(): Router {
  const router = Router();
  router.use(requireAuth);

  router.post("/synthesize", async (req, res) => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ message: "Sintesi vocale AI non configurata" });
    }

    const text = typeof req.body.text === "string" ? req.body.text.slice(0, MAX_TEXT_LENGTH) : "";
    if (!text.trim()) {
      return res.status(400).json({ message: "Testo mancante" });
    }

    const voiceId = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;

    try {
      const upstream = await fetch(`${ELEVENLABS_API_URL}/${voiceId}`, {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      });

      if (!upstream.ok || !upstream.body) {
        const detail = await upstream.text().catch(() => "");
        console.error("ElevenLabs TTS error:", upstream.status, detail);
        return res.status(502).json({ message: "Sintesi vocale AI non disponibile" });
      }

      res.set("Content-Type", "audio/mpeg");
      const reader = upstream.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } catch (err) {
      console.error("ElevenLabs TTS request failed:", err);
      res.status(502).json({ message: "Sintesi vocale AI non disponibile" });
    }
  });

  return router;
}
