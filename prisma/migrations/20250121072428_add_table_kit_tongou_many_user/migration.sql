-- CreateTable
CREATE TABLE "KitTongouManyUser" (
    "kitTongouId" INTEGER NOT NULL,
    "utilisateurId" INTEGER NOT NULL,
    "compteElectriciteEauId" INTEGER NOT NULL,
    "valid" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "KitTongouManyUser_pkey" PRIMARY KEY ("utilisateurId","compteElectriciteEauId","kitTongouId")
);

-- AddForeignKey
ALTER TABLE "KitTongouManyUser" ADD CONSTRAINT "KitTongouManyUser_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitTongouManyUser" ADD CONSTRAINT "KitTongouManyUser_compteElectriciteEauId_fkey" FOREIGN KEY ("compteElectriciteEauId") REFERENCES "CompteElectriciteEau"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitTongouManyUser" ADD CONSTRAINT "KitTongouManyUser_kitTongouId_fkey" FOREIGN KEY ("kitTongouId") REFERENCES "KitTongou"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
