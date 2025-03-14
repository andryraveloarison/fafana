/*
  Warnings:

  - You are about to drop the `CompteElectricite` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CompteElectricite" DROP CONSTRAINT "CompteElectricite_utilisateurId_fkey";

-- DropTable
DROP TABLE "CompteElectricite";

-- CreateTable
CREATE TABLE "CompteElectriciteEau" (
    "id" SERIAL NOT NULL,
    "pseudoCompte" TEXT NOT NULL,
    "titulaire" TEXT NOT NULL,
    "referenceClient" TEXT NOT NULL,
    "agence" TEXT NOT NULL,
    "communeClient" INTEGER NOT NULL,
    "commune" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "compteurElectricite" TEXT NOT NULL,
    "tarif" TEXT NOT NULL,
    "puissance" DOUBLE PRECISION NOT NULL,
    "activite" TEXT NOT NULL,
    "compteurEau" TEXT,
    "tarifEau" TEXT,
    "calibrage" INTEGER,
    "redevanceEau" DOUBLE PRECISION,
    "utilisateurId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompteElectriciteEau_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CompteElectriciteEau" ADD CONSTRAINT "CompteElectriciteEau_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
