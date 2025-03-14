-- CreateTable
CREATE TABLE "Fournisseur" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "phone" TEXT,
    "whatsapp" TEXT,
    "facebook" TEXT,
    "instagram" TEXT,
    "linkdin" TEXT,
    "site" TEXT,
    "image" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "zoneId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fournisseur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produit" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "prix" DOUBLE PRECISION NOT NULL,
    "image" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fournisseurId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Produit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Fournisseur_nom_key" ON "Fournisseur"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Produit_nom_key" ON "Produit"("nom");

-- AddForeignKey
ALTER TABLE "Fournisseur" ADD CONSTRAINT "Fournisseur_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produit" ADD CONSTRAINT "Produit_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "Fournisseur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
