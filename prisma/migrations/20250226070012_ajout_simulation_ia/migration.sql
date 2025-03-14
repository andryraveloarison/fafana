-- CreateTable
CREATE TABLE "Simulationia" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "simulation" TEXT NOT NULL,
    "listeAppareil" TEXT NOT NULL,
    "utilisateurId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Simulationia_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Simulationia" ADD CONSTRAINT "Simulationia_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;
