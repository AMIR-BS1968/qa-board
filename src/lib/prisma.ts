import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import fs from "fs";
import path from "path";

// Load environment variables from .env.local if not already loaded (useful for running scripts outside Next.js)
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, "utf-8");
  envContent.split(/\r?\n/).forEach((line) => {
    if (line.trim().startsWith("#") || !line.includes("=")) return;
    
    const [key, ...valueParts] = line.split("=");
    const rawValue = valueParts.join("=").trim();
    const value = rawValue.replace(/^["']|["']$/g, "");
    
    process.env[key.trim()] = value;
  });
}

// Fall back to DIRECT_URL if DATABASE_URL (pooler) connection fails or is blocked locally
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
