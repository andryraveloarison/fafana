-- AlterTable
ALTER TABLE "KitTongou" ADD COLUMN     "kitTypeId" INTEGER;

-- AddForeignKey
ALTER TABLE "KitTongou" ADD CONSTRAINT "KitTongou_kitTypeId_fkey" FOREIGN KEY ("kitTypeId") REFERENCES "KitType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
