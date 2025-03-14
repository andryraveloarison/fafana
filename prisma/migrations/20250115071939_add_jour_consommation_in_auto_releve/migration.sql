/*
  Warnings:

  - Added the required column `joursConsommation` to the `KitTongouAutoReleve` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "KitTongouAutoReleve" ADD COLUMN     "joursConsommation" INTEGER NOT NULL;
