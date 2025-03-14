/*
  Warnings:

  - Added the required column `idTongou` to the `KitTongou` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "KitTongou" ADD COLUMN     "idTongou" TEXT NOT NULL;
