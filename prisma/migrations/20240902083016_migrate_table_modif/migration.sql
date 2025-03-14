-- DropForeignKey
ALTER TABLE "Avis" DROP CONSTRAINT "Avis_utilisateurId_fkey";

-- AlterTable
ALTER TABLE "Agence" ADD COLUMN     "province" TEXT NOT NULL DEFAULT 'Unknown',
ALTER COLUMN "tourneId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Avis" ALTER COLUMN "utilisateurId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "CompteElectriciteEau" ADD COLUMN     "typeCompte" TEXT;

-- AlterTable
ALTER TABLE "Utilisateur" ADD COLUMN     "adresse" TEXT;

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "utilisateurId" TEXT,
    "zoneId" TEXT,
    "agenceUser" TEXT,
    "commune" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "dossiers" TEXT,
    "typeService" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Litige" (
    "id" SERIAL NOT NULL,
    "utilisateurId" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "status" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Litige_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Service_type_key" ON "Service"("type");

-- AddForeignKey
ALTER TABLE "Avis" ADD CONSTRAINT "Avis_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Litige" ADD CONSTRAINT "Litige_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Litige" ADD CONSTRAINT "Litige_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
