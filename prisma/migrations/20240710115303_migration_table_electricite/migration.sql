-- CreateTable
CREATE TABLE "Tarif" (
    "id" SERIAL NOT NULL,
    "tarif" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tarif_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fne" (
    "id" SERIAL NOT NULL,
    "tarif" TEXT NOT NULL,
    "t1" DOUBLE PRECISION NOT NULL,
    "t2" DOUBLE PRECISION NOT NULL,
    "t3" DOUBLE PRECISION NOT NULL,
    "t4" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agence" (
    "id" SERIAL NOT NULL,
    "agenceCode" TEXT NOT NULL,
    "agence" TEXT NOT NULL,
    "tourneId" INTEGER NOT NULL,
    "communeId" INTEGER NOT NULL,
    "commune" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prix" (
    "id" SERIAL NOT NULL,
    "zoneId" TEXT NOT NULL,
    "tarif" TEXT NOT NULL,
    "q1" DOUBLE PRECISION NOT NULL,
    "q2" DOUBLE PRECISION NOT NULL,
    "q3" DOUBLE PRECISION NOT NULL,
    "q4" DOUBLE PRECISION NOT NULL,
    "p1" DOUBLE PRECISION NOT NULL,
    "p2" DOUBLE PRECISION NOT NULL,
    "p3" DOUBLE PRECISION NOT NULL,
    "p4" DOUBLE PRECISION NOT NULL,
    "prime" DOUBLE PRECISION NOT NULL,
    "redevance" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Taxe" (
    "id" SERIAL NOT NULL,
    "site" TEXT NOT NULL,
    "communeId" TEXT NOT NULL,
    "activite" TEXT NOT NULL,
    "taxe_communale" DOUBLE PRECISION NOT NULL,
    "surtaxe" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Taxe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZoneElectriciteEau" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZoneElectriciteEau_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tarif_tarif_key" ON "Tarif"("tarif");

-- CreateIndex
CREATE UNIQUE INDEX "Fne_tarif_key" ON "Fne"("tarif");

-- CreateIndex
CREATE UNIQUE INDEX "Agence_agenceCode_key" ON "Agence"("agenceCode");

-- CreateIndex
CREATE UNIQUE INDEX "Prix_zoneId_key" ON "Prix"("zoneId");

-- CreateIndex
CREATE UNIQUE INDEX "Taxe_site_key" ON "Taxe"("site");

-- CreateIndex
CREATE UNIQUE INDEX "ZoneElectriciteEau_code_key" ON "ZoneElectriciteEau"("code");
