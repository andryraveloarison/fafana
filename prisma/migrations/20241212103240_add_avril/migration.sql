/*
  Warnings:

  - Added the required column `avril` to the `CompteElectriciteEauCible` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CompteElectriciteEauCible" ADD COLUMN     "avril" DOUBLE PRECISION NOT NULL;
