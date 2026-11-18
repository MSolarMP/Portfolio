-- DropForeignKey
ALTER TABLE "Album" DROP CONSTRAINT "Album_interestId_fkey";

-- DropForeignKey
ALTER TABLE "Media" DROP CONSTRAINT "Media_albumId_fkey";

-- DropIndex
DROP INDEX "Media_albumId_idx";

-- AlterTable
ALTER TABLE "Media" DROP COLUMN "albumId",
DROP COLUMN "exif",
DROP COLUMN "order",
DROP COLUMN "region";

-- DropTable
DROP TABLE "Album";

