-- AlterTable
ALTER TABLE "Account" ADD COLUMN "leadScore" TEXT,
ADD COLUMN "leadScoreAuto" BOOLEAN NOT NULL DEFAULT true;
