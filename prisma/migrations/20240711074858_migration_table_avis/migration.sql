-- CreateTable
CREATE TABLE "Avis" (
    "id" SERIAL NOT NULL,
    "avis" TEXT NOT NULL,
    "utilisateurId" INTEGER NOT NULL,
    "expertId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Avis_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Avis" ADD CONSTRAINT "Avis_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avis" ADD CONSTRAINT "Avis_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "Expert"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
