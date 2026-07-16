import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  // On Vercel, DATABASE_URL is injected. Locally we prefer DIRECT_URL to avoid pooler blocks.
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
  const maxPoolSize = 1;
  const pool = new Pool({ 
    connectionString,
    max: maxPoolSize,
    idleTimeoutMillis: process.env.NODE_ENV === "production" ? 30000 : 1000,
    allowExitOnIdle: process.env.NODE_ENV !== "production",
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
