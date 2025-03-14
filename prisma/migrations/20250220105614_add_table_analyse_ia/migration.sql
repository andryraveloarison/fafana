/*
  Warnings:

  - Added the required column `analyseaiId` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "analyseaiId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Analyseia" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "analyse" TEXT NOT NULL,
    "utilisateurId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Analyseia_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_analyseaiId_fkey" FOREIGN KEY ("analyseaiId") REFERENCES "Analyseia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analyseia" ADD CONSTRAINT "Analyseia_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;
