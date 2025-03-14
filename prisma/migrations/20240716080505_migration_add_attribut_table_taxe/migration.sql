/*
  Warnings:

  - Added the required column `type_surtaxe` to the `Taxe` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type_taxe` to the `Taxe` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zone_suratxe` to the `Taxe` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Taxe" ADD COLUMN     "type_surtaxe" INTEGER NOT NULL,
ADD COLUMN     "type_taxe" INTEGER NOT NULL,
ADD COLUMN     "zone_suratxe" TEXT NOT NULL;
