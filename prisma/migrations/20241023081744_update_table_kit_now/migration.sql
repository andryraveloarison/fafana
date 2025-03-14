/*
  Warnings:

  - You are about to drop the column `t1` on the `Kit` table. All the data in the column will be lost.
  - You are about to drop the column `t2` on the `Kit` table. All the data in the column will be lost.
  - You are about to drop the column `t3` on the `Kit` table. All the data in the column will be lost.
  - You are about to drop the column `t4` on the `Kit` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Kit" DROP COLUMN "t1",
DROP COLUMN "t2",
DROP COLUMN "t3",
DROP COLUMN "t4",
ADD COLUMN     "consommationBut" DOUBLE PRECISION,
ADD COLUMN     "consommationHeure" DOUBLE PRECISION,
ADD COLUMN     "consommationJour" DOUBLE PRECISION,
ADD COLUMN     "consommationMin" DOUBLE PRECISION,
ADD COLUMN     "pourcentageTranche" TEXT,
ADD COLUMN     "tranche" DOUBLE PRECISION;
