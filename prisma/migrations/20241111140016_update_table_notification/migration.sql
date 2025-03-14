-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "kitTongouId" INTEGER;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_kitTongouId_fkey" FOREIGN KEY ("kitTongouId") REFERENCES "KitTongou"("id") ON DELETE SET NULL ON UPDATE CASCADE;
