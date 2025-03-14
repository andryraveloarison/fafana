/*
  Warnings:

  - You are about to drop the column `modeGestionId` on the `CompteElectriciteEau` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "CompteElectriciteEau" DROP CONSTRAINT "CompteElectriciteEau_modeGestionId_fkey";

-- AlterTable
ALTER TABLE "CompteElectriciteEau" DROP COLUMN "modeGestionId";
