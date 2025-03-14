/*
  Warnings:

  - You are about to drop the column `compteElectriciteId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `kitTongouId` on the `Notification` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_compteElectriciteId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_kitTongouId_fkey";

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "compteElectriciteId",
DROP COLUMN "kitTongouId";

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;
