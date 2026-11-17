-- Owner-only sign-in: the ADMIN_EMAILS allow-list decides access, so Better Auth's admin
-- plugin fields (role, bans, impersonation) and the unused phone fields are dropped.

-- AlterTable
ALTER TABLE "session" DROP COLUMN "impersonatedBy";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "banExpires",
DROP COLUMN "banReason",
DROP COLUMN "banned",
DROP COLUMN "phone",
DROP COLUMN "phoneVerified",
DROP COLUMN "role";

