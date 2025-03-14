/*
  Warnings:

  - Made the column `modeGestionId` on table `KitValeurBut` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "KitValeurBut" DROP CONSTRAINT "KitValeurBut_modeGestionId_fkey";

-- AlterTable
ALTER TABLE "KitValeurBut" ALTER COLUMN "modeGestionId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "KitValeurBut" ADD CONSTRAINT "KitValeurBut_modeGestionId_fkey" FOREIGN KEY ("modeGestionId") REFERENCES "ModeGestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
