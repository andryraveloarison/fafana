/*
  Warnings:

  - You are about to drop the `Fournisseur` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Produit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TypeProduit` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Fournisseur" DROP CONSTRAINT "Fournisseur_zoneId_fkey";

-- DropForeignKey
ALTER TABLE "Produit" DROP CONSTRAINT "Produit_fournisseurId_fkey";

-- DropForeignKey
ALTER TABLE "Produit" DROP CONSTRAINT "Produit_typeproduitId_fkey";

-- DropTable
DROP TABLE "Fournisseur";

-- DropTable
DROP TABLE "Produit";

-- DropTable
DROP TABLE "TypeProduit";
