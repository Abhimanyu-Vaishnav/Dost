import { PrismaClient } from "@prisma/client";

function getActiveDatabaseUrl() {
  const url = process.env.DATABASE_URL;

  // If valid PostgreSQL URL is present, use it directly
  if (url && (url.startsWith("postgres://") || url.startsWith("postgresql://"))) {
    return url;
  }

  return url;
}

const activeUrl = getActiveDatabaseUrl();
if (activeUrl) {
  process.env.DATABASE_URL = activeUrl;
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
