-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "compteElectriciteId" INTEGER;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_compteElectriciteId_fkey" FOREIGN KEY ("compteElectriciteId") REFERENCES "CompteElectriciteEau"("id") ON DELETE SET NULL ON UPDATE CASCADE;
