-- CreateTable
CREATE TABLE "KitTongouUser" (
    "id" SERIAL NOT NULL,
    "utilisateurId" INTEGER NOT NULL,
    "kitTongouId" INTEGER NOT NULL,
    "compteElectriciteEauId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KitTongouUser_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "KitTongouUser" ADD CONSTRAINT "KitTongouUser_kitTongouId_fkey" FOREIGN KEY ("kitTongouId") REFERENCES "KitTongou"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitTongouUser" ADD CONSTRAINT "KitTongouUser_compteElectriciteEauId_fkey" FOREIGN KEY ("compteElectriciteEauId") REFERENCES "CompteElectriciteEau"("id") ON DELETE SET NULL ON UPDATE CASCADE;
