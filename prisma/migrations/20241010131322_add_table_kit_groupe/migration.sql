-- AlterTable
ALTER TABLE "UserAppareil" ADD COLUMN     "kitGroupeId" INTEGER;

-- CreateTable
CREATE TABLE "KitGroupe" (
    "id" SERIAL NOT NULL,
    "kitgroupe" TEXT NOT NULL,
    "utilisateurId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KitGroupe_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "KitGroupe" ADD CONSTRAINT "KitGroupe_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAppareil" ADD CONSTRAINT "UserAppareil_kitGroupeId_fkey" FOREIGN KEY ("kitGroupeId") REFERENCES "KitGroupe"("id") ON DELETE SET NULL ON UPDATE CASCADE;
