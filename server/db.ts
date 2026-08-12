import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";
import { fileURLToPath } from "url";
import * as schema from "@shared/schema";

const sqlite = new Database(process.env.DATABASE_URL || "./data.db");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

// __dirname exists as a real CJS global in the esbuild-bundled production output, but not
// under tsx's ESM dev runtime — fall back to import.meta.url there instead.
const currentDir = typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));
migrate(db, { migrationsFolder: path.resolve(currentDir, "..", "migrations") });
