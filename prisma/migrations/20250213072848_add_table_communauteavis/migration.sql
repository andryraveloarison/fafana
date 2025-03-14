-- CreateTable
CREATE TABLE "CommunauteAvis" (
    "id" SERIAL NOT NULL,
    "avis" TEXT NOT NULL DEFAULT 'Je suis content',
    "utilisateurId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunauteAvis_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CommunauteAvis" ADD CONSTRAINT "CommunauteAvis_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;
