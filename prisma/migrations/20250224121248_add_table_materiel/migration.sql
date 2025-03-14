-- CreateTable
CREATE TABLE "Materiel" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Materiel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TypeHome" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TypeHome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterielToTypeHome" (
    "id" SERIAL NOT NULL,
    "typehomeId" INTEGER NOT NULL,
    "materielId" INTEGER NOT NULL,

    CONSTRAINT "MaterielToTypeHome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompteMateriel" (
    "id" SERIAL NOT NULL,
    "compteElectriciteEauCibleId" INTEGER NOT NULL,
    "materieltotypehomeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompteMateriel_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MaterielToTypeHome" ADD CONSTRAINT "MaterielToTypeHome_typehomeId_fkey" FOREIGN KEY ("typehomeId") REFERENCES "TypeHome"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterielToTypeHome" ADD CONSTRAINT "MaterielToTypeHome_materielId_fkey" FOREIGN KEY ("materielId") REFERENCES "Materiel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompteMateriel" ADD CONSTRAINT "CompteMateriel_compteElectriciteEauCibleId_fkey" FOREIGN KEY ("compteElectriciteEauCibleId") REFERENCES "CompteElectriciteEau"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompteMateriel" ADD CONSTRAINT "CompteMateriel_materieltotypehomeId_fkey" FOREIGN KEY ("materieltotypehomeId") REFERENCES "MaterielToTypeHome"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
