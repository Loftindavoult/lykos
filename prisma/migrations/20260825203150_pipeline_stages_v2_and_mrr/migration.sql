-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "addonConsulting" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "addonInventory" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "everActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mrr" INTEGER,
ADD COLUMN     "mrrCustom" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "packageLevel" TEXT,
ADD COLUMN     "userCount" INTEGER;

-- Backfill: remap the old stage taxonomy (Cold Lead/Warm Lead/Qualified/
-- Proposal/Won/Lost) onto the new one (Lead/Opportunity/Build/Approval/
-- Negotiations/Deploy/Active/Inactive) so existing production accounts
-- don't silently vanish from the board after this deploy.
UPDATE "Account" SET stage = 'Lead' WHERE stage = 'Cold Lead';
UPDATE "Account" SET stage = 'Opportunity' WHERE stage = 'Warm Lead';
UPDATE "Account" SET stage = 'Build' WHERE stage = 'Qualified';
UPDATE "Account" SET stage = 'Negotiations' WHERE stage = 'Proposal';
UPDATE "Account" SET stage = 'Active', "everActive" = true WHERE stage = 'Won';
UPDATE "Account" SET stage = 'Inactive' WHERE stage = 'Lost';
