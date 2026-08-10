import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

export function createSessionMiddleware() {
  const secret = process.env.SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set in production");
  }

  return session({
    secret: secret || "dev-only-insecure-secret",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({ checkPeriod: 24 * 60 * 60 * 1000 }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    },
  });
}
