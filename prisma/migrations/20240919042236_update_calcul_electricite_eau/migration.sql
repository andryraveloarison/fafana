/*
  Warnings:

  - You are about to drop the column `Total` on the `CalculElectriciteEau` table. All the data in the column will be lost.
  - Added the required column `consommationEau` to the `CalculElectriciteEau` table without a default value. This is not possible if the table is not empty.
  - Added the required column `consommationElectricite` to the `CalculElectriciteEau` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `CalculElectriciteEau` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CalculElectriciteEau" DROP COLUMN "Total",
ADD COLUMN     "consommationEau" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "consommationElectricite" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "total" DOUBLE PRECISION NOT NULL;
