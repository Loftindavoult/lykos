import { PrismaClient } from "@prisma/client";

// Reuse a single PrismaClient across hot reloads in dev so we don't exhaust
// the Postgres connection pool every time a file changes.
const globalForPrisma = globalThis;

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
