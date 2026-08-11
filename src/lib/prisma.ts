import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

function setupDatabaseUrl() {
  const envUrl = process.env.DATABASE_URL;

  // If user provided a cloud PostgreSQL database (e.g. Neon, Supabase, Vercel Postgres)
  if (envUrl && (envUrl.startsWith("postgres://") || envUrl.startsWith("postgresql://"))) {
    return envUrl;
  }

  // On Vercel / Serverless environment fallback for SQLite:
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    const tmpDbPath = "/tmp/dost_v2.db";
    try {
      if (!fs.existsSync(tmpDbPath)) {
        const seedDbPath = path.join(process.cwd(), "prisma", "seed.db");
        if (fs.existsSync(seedDbPath)) {
          fs.copyFileSync(seedDbPath, tmpDbPath);
        }
      }
      return `file:${tmpDbPath}`;
    } catch (e) {
      console.error("Error setting up serverless SQLite database:", e);
    }
  }

  return envUrl || "file:./dev.db";
}

const activeDbUrl = setupDatabaseUrl();
if (activeDbUrl) {
  process.env.DATABASE_URL = activeDbUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
