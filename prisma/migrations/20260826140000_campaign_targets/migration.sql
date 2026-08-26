-- AlterTable
ALTER TABLE "Account" ADD COLUMN "campaignId" TEXT;

-- CreateIndex
CREATE INDEX "Account_campaignId_idx" ON "Account"("campaignId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
