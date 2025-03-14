-- CreateTable
CREATE TABLE "CompteElectricite" (
    "id" SERIAL NOT NULL,
    "titulaire" TEXT NOT NULL,
    "referenceClient" TEXT NOT NULL,
    "agence" TEXT NOT NULL,
    "communeClient" INTEGER NOT NULL,
    "commune" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "compteurElectricite" TEXT NOT NULL,
    "tarif" TEXT NOT NULL,
    "puissance" DOUBLE PRECISION NOT NULL,
    "utilisateurId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompteElectricite_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CompteElectricite" ADD CONSTRAINT "CompteElectricite_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
