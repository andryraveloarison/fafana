-- AlterTable
ALTER TABLE "Produit" ADD COLUMN     "typeproduitId" INTEGER;

-- CreateTable
CREATE TABLE "TypeProduit" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TypeProduit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TypeProduit_type_key" ON "TypeProduit"("type");

-- AddForeignKey
ALTER TABLE "Produit" ADD CONSTRAINT "Produit_typeproduitId_fkey" FOREIGN KEY ("typeproduitId") REFERENCES "TypeProduit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
