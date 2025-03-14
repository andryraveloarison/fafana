-- CreateTable
CREATE TABLE "CalculElectriciteEau" (
    "id" SERIAL NOT NULL,
    "compteElectriciteEauId" INTEGER NOT NULL,
    "prixElectricite" DOUBLE PRECISION NOT NULL,
    "prixEau" DOUBLE PRECISION NOT NULL,
    "Total" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalculElectriciteEau_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CalculElectriciteEau" ADD CONSTRAINT "CalculElectriciteEau_compteElectriciteEauId_fkey" FOREIGN KEY ("compteElectriciteEauId") REFERENCES "CompteElectriciteEau"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
