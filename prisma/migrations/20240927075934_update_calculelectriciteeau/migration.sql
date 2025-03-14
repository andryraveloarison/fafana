/*
  Warnings:

  - Added the required column `ancienEau` to the `CalculElectriciteEau` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ancienElectricite` to the `CalculElectriciteEau` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nouvelEau` to the `CalculElectriciteEau` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nouvelElectricite` to the `CalculElectriciteEau` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CalculElectriciteEau" ADD COLUMN     "ancienEau" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "ancienElectricite" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "nouvelEau" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "nouvelElectricite" DOUBLE PRECISION NOT NULL;
