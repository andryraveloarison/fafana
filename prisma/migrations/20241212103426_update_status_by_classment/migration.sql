/*
  Warnings:

  - You are about to drop the column `status` on the `CompteElectriciteEauCible` table. All the data in the column will be lost.
  - Added the required column `classement` to the `CompteElectriciteEauCible` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CompteElectriciteEauCible" DROP COLUMN "status",
ADD COLUMN     "classement" INTEGER NOT NULL;
