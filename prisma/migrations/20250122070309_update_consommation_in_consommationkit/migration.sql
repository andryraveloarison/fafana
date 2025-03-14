/*
  Warnings:

  - You are about to drop the column `consommation` on the `AutoReleve` table. All the data in the column will be lost.
  - Added the required column `consommationKit` to the `AutoReleve` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AutoReleve" DROP COLUMN "consommation",
ADD COLUMN     "consommationKit" DOUBLE PRECISION NOT NULL;
