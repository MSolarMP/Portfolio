-- 1. Owner-only sign-in: drop the visitor features (runes, guestbook).
-- 2. Store every timestamp as timestamptz; existing values are UTC, so convert AT TIME ZONE 'UTC'.
--    Chapter dates become plain dates.
-- 3. Index the columns Better Auth queries by.
-- 4. Add Commendations (LinkedIn recommendations entered via the admin).

-- DropForeignKey
ALTER TABLE "GuestbookEntry" DROP CONSTRAINT "GuestbookEntry_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserRune" DROP CONSTRAINT "UserRune_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserRune" DROP CONSTRAINT "UserRune_runeId_fkey";

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "banExpires" SET DATA TYPE TIMESTAMPTZ(3) USING "banExpires" AT TIME ZONE 'UTC',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "session" ALTER COLUMN "expiresAt" SET DATA TYPE TIMESTAMPTZ(3) USING "expiresAt" AT TIME ZONE 'UTC',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "account" ALTER COLUMN "accessTokenExpiresAt" SET DATA TYPE TIMESTAMPTZ(3) USING "accessTokenExpiresAt" AT TIME ZONE 'UTC',
ALTER COLUMN "refreshTokenExpiresAt" SET DATA TYPE TIMESTAMPTZ(3) USING "refreshTokenExpiresAt" AT TIME ZONE 'UTC',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "verification" ALTER COLUMN "expiresAt" SET DATA TYPE TIMESTAMPTZ(3) USING "expiresAt" AT TIME ZONE 'UTC',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "ContentBlock" ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "Interest" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "Album" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "Media" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "Quest" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "Chapter" ALTER COLUMN "startDate" SET DATA TYPE DATE,
ALTER COLUMN "endDate" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "SiteSetting" ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "readAt" SET DATA TYPE TIMESTAMPTZ(3) USING "readAt" AT TIME ZONE 'UTC',
ALTER COLUMN "archivedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "archivedAt" AT TIME ZONE 'UTC',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- DropTable
DROP TABLE "GuestbookEntry";

-- DropTable
DROP TABLE "Rune";

-- DropTable
DROP TABLE "UserRune";

-- CreateTable
CREATE TABLE "Commendation" (
    "id" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "headline" TEXT,
    "relationship" TEXT,
    "givenOn" DATE,
    "profileUrl" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" "Status" NOT NULL DEFAULT 'DRAFT',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Commendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Commendation_status_order_idx" ON "Commendation"("status", "order");

-- CreateIndex
CREATE UNIQUE INDEX "account_providerId_accountId_key" ON "account"("providerId", "accountId");

-- CreateIndex
CREATE INDEX "verification_expiresAt_idx" ON "verification"("expiresAt");


-- Keep the Supabase Data API locked: RLS on, no policies (app connects as table owner).
ALTER TABLE "Commendation" ENABLE ROW LEVEL SECURITY;
