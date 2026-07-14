import { handlers } from "@/auth";

// Force this route to always be server-rendered dynamically at request time.
// This prevents Next.js from attempting static analysis during build,
// which would crash because pg/Prisma requires runtime environment variables.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const { GET, POST } = handlers;
