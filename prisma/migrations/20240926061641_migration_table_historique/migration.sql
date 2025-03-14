-- CreateTable
CREATE TABLE "Historique" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "utilisateurId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Historique_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Historique" ADD CONSTRAINT "Historique_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
