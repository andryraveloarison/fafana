/*
  Warnings:

  - Added the required column `prix` to the `KitTongouAutoReleve` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "KitTongouAutoReleve" ADD COLUMN     "prix" DOUBLE PRECISION NOT NULL;
