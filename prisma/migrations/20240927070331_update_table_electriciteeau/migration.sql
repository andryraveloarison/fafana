/*
  Warnings:

  - Added the required column `fneElectricite` to the `CalculElectriciteEau` table without a default value. This is not possible if the table is not empty.
  - Added the required column `primeEau` to the `CalculElectriciteEau` table without a default value. This is not possible if the table is not empty.
  - Added the required column `primeElectricite` to the `CalculElectriciteEau` table without a default value. This is not possible if the table is not empty.
  - Added the required column `redevanceEau` to the `CalculElectriciteEau` table without a default value. This is not possible if the table is not empty.
  - Added the required column `redevanceElectricite` to the `CalculElectriciteEau` table without a default value. This is not possible if the table is not empty.
  - Added the required column `redevance_eau_usee_taxe` to the `CalculElectriciteEau` table without a default value. This is not possible if the table is not empty.
  - Added the required column `surtaxeEau` to the `CalculElectriciteEau` table without a default value. This is not possible if the table is not empty.
  - Added the required column `surtaxeElectricite` to the `CalculElectriciteEau` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taxe_communaleEau` to the `CalculElectriciteEau` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taxe_communaleElectricite` to the `CalculElectriciteEau` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tvaElectricite` to the `CalculElectriciteEau` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tva_eau` to the `CalculElectriciteEau` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CalculElectriciteEau" ADD COLUMN     "fneElectricite" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "primeEau" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "primeElectricite" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "redevanceEau" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "redevanceElectricite" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "redevance_eau_usee_taxe" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "surtaxeEau" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "surtaxeElectricite" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "taxe_communaleEau" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "taxe_communaleElectricite" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "tvaElectricite" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "tva_eau" DOUBLE PRECISION NOT NULL;
