/*
  Warnings:

  - You are about to drop the `Avis` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Expert` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TypeExpert` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ExpertTypeExpert` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Avis" DROP CONSTRAINT "Avis_expertId_fkey";

-- DropForeignKey
ALTER TABLE "Avis" DROP CONSTRAINT "Avis_utilisateurId_fkey";

-- DropForeignKey
ALTER TABLE "Expert" DROP CONSTRAINT "Expert_zoneId_fkey";

-- DropForeignKey
ALTER TABLE "_ExpertTypeExpert" DROP CONSTRAINT "_ExpertTypeExpert_A_fkey";

-- DropForeignKey
ALTER TABLE "_ExpertTypeExpert" DROP CONSTRAINT "_ExpertTypeExpert_B_fkey";

-- DropTable
DROP TABLE "Avis";

-- DropTable
DROP TABLE "Expert";

-- DropTable
DROP TABLE "TypeExpert";

-- DropTable
DROP TABLE "_ExpertTypeExpert";
