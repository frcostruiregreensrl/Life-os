import type { Express } from "express";
import type { Server } from "http";
import { createSessionMiddleware } from "./session";
import { createAuthRouter } from "./auth";
import { createTodosRouter } from "./routes/todos";
import { createHabitsRouter } from "./routes/habits";

export async function registerRoutes(_httpServer: Server, app: Express) {
  app.use(createSessionMiddleware());

  app.use("/api/auth", createAuthRouter());
  app.use("/api/todos", createTodosRouter());
  app.use("/api/habits", createHabitsRouter());
}
