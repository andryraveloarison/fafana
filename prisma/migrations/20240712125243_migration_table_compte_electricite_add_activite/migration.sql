/*
  Warnings:

  - Added the required column `activite` to the `CompteElectricite` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CompteElectricite" ADD COLUMN     "activite" TEXT NOT NULL;
