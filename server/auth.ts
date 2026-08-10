import type { Request, Response, NextFunction, Router } from "express";
import { Router as createRouter } from "express";
import { storage } from "./storage";
import { hashPassword, verifyPassword } from "./password";
import { registerSchema, loginSchema, type PublicUser } from "@shared/schema";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Non autenticato" });
  }
  next();
}

function toPublicUser(user: { id: number; email: string; name: string; createdAt: Date }): PublicUser {
  return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
}

export function createAuthRouter(): Router {
  const router = createRouter();

  router.post("/register", async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message || "Dati non validi" });
    }

    const { email, password, name } = parsed.data;
    const existing = await storage.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "Un utente con questa email esiste già" });
    }

    const passwordHash = await hashPassword(password);
    const user = await storage.createUser({ email, passwordHash, name });
    req.session.userId = user.id;
    res.status(201).json(toPublicUser(user));
  });

  router.post("/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Email o password non validi" });
    }

    const { email, password } = parsed.data;
    const user = await storage.getUserByEmail(email);
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    req.session.userId = user.id;
    res.json(toPublicUser(user));
  });

  router.post("/logout", (req, res) => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.status(204).end();
    });
  });

  router.get("/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Non autenticato" });
    }
    const user = await storage.getUserById(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "Non autenticato" });
    }
    res.json(toPublicUser(user));
  });

  return router;
}
