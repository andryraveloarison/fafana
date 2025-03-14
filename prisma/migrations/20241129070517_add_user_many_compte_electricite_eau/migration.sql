-- CreateTable
CREATE TABLE "UserManyCompteElectriciteEau" (
    "utilisateurId" INTEGER NOT NULL,
    "compteElectriciteEauId" INTEGER NOT NULL,
    "valid" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserManyCompteElectriciteEau_pkey" PRIMARY KEY ("utilisateurId","compteElectriciteEauId")
);

-- AddForeignKey
ALTER TABLE "UserManyCompteElectriciteEau" ADD CONSTRAINT "UserManyCompteElectriciteEau_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserManyCompteElectriciteEau" ADD CONSTRAINT "UserManyCompteElectriciteEau_compteElectriciteEauId_fkey" FOREIGN KEY ("compteElectriciteEauId") REFERENCES "CompteElectriciteEau"("id") ON DELETE CASCADE ON UPDATE CASCADE;
