-- CreateTable
CREATE TABLE "KitTongouPersoUsers" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "utilisateurId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KitTongouPersoUsers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "KitTongouPersoUsers" ADD CONSTRAINT "KitTongouPersoUsers_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
