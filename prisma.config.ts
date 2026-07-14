import { defineConfig } from "prisma/config";
import fs from "fs";
import path from "path";

// Load environment variables from .env.local so they are available to the Prisma CLI
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

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    // Priority: use DIRECT_URL for migrations/DDL push schema operations
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
  },
});
