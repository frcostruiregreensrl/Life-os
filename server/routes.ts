import type { Express } from "express";
import type { Server } from "http";
import { createSessionMiddleware } from "./session";
import { createAuthRouter } from "./auth";
import { createTodosRouter } from "./routes/todos";
import { createHabitsRouter } from "./routes/habits";
import { createOnboardingRouter } from "./routes/onboarding";
import { createSettingsRouter } from "./routes/settings";
import { createSpeechRouter } from "./routes/speech";

export async function registerRoutes(_httpServer: Server, app: Express) {
  app.use(createSessionMiddleware());

  app.use("/api/auth", createAuthRouter());
  app.use("/api/todos", createTodosRouter());
  app.use("/api/habits", createHabitsRouter());
  app.use("/api/onboarding", createOnboardingRouter());
  app.use("/api/settings", createSettingsRouter());
  app.use("/api/speech", createSpeechRouter());
}
