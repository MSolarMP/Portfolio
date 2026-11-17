import "dotenv/config";
import { defineConfig } from "prisma/config";

// The Prisma CLI (migrate, studio, db pull) uses the DIRECT connection.
// Supabase's pooled URL (port 6543, transaction mode) can't run migrations.
// The app itself connects with DATABASE_URL (pooled) — see src/server/db.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL,
  },
});
