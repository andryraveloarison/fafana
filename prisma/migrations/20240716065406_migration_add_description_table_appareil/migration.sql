/*
  Warnings:

  - Added the required column `description` to the `Appareil` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Appareil" ADD COLUMN     "description" TEXT NOT NULL;
