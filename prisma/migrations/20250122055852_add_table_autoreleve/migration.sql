-- CreateTable
CREATE TABLE "AutoReleve" (
    "id" SERIAL NOT NULL,
    "compteElectriciteEauId" INTEGER NOT NULL,
    "index" DOUBLE PRECISION NOT NULL,
    "consommation" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "indexAjouter" DOUBLE PRECISION NOT NULL,
    "reste" DOUBLE PRECISION NOT NULL,
    "joursConsommation" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoReleve_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AutoReleve" ADD CONSTRAINT "AutoReleve_compteElectriciteEauId_fkey" FOREIGN KEY ("compteElectriciteEauId") REFERENCES "CompteElectriciteEau"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
