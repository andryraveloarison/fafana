-- AlterTable
ALTER TABLE "CompteElectriciteEau" ADD COLUMN     "modeGestionId" INTEGER;

-- CreateTable
CREATE TABLE "ModeGestion" (
    "id" SERIAL NOT NULL,
    "mode" TEXT NOT NULL,
    "pourcent" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModeGestion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CompteElectriciteEau" ADD CONSTRAINT "CompteElectriciteEau_modeGestionId_fkey" FOREIGN KEY ("modeGestionId") REFERENCES "ModeGestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
