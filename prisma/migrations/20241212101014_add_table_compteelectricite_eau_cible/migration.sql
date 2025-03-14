-- AlterTable
ALTER TABLE "CompteElectriciteEau" ADD COLUMN     "compteCibleId" INTEGER;

-- CreateTable
CREATE TABLE "CompteElectriciteEauCible" (
    "id" SERIAL NOT NULL,
    "code_agence" TEXT NOT NULL,
    "referenceClient" TEXT NOT NULL,
    "jan" DOUBLE PRECISION NOT NULL,
    "fev" DOUBLE PRECISION NOT NULL,
    "mars" DOUBLE PRECISION NOT NULL,
    "somme" DOUBLE PRECISION NOT NULL,
    "tarif" TEXT,
    "designation" TEXT,
    "categorie" INTEGER,
    "type" TEXT,
    "status" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompteElectriciteEauCible_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CompteElectriciteEau" ADD CONSTRAINT "CompteElectriciteEau_compteCibleId_fkey" FOREIGN KEY ("compteCibleId") REFERENCES "CompteElectriciteEauCible"("id") ON DELETE SET NULL ON UPDATE CASCADE;
