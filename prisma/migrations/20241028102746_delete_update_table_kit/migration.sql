/*
  Warnings:

  - You are about to drop the column `d1` on the `Kit` table. All the data in the column will be lost.
  - You are about to drop the column `d2` on the `Kit` table. All the data in the column will be lost.
  - You are about to drop the column `d3` on the `Kit` table. All the data in the column will be lost.
  - You are about to drop the column `d4` on the `Kit` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Kit" DROP COLUMN "d1",
DROP COLUMN "d2",
DROP COLUMN "d3",
DROP COLUMN "d4";
