import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// One PrismaClient per server process. In dev, Next.js hot-reloads modules,
// so we stash the instance on globalThis to avoid exhausting connections.
// DATABASE_URL is Supabase's transaction pooler (port 6543), which suits
// short-lived serverless functions on Vercel.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  }
  // Small pool per serverless instance: many instances × pg's default of 10
  // would exhaust Supavisor's client limit.
  const adapter = new PrismaPg({
    connectionString,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
