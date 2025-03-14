/*
  Warnings:

  - You are about to drop the `KitTongouPersoUsers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "KitTongouPersoUsers" DROP CONSTRAINT "KitTongouPersoUsers_utilisateurId_fkey";

-- DropTable
DROP TABLE "KitTongouPersoUsers";

-- CreateTable
CREATE TABLE "BlogPersoUser" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "utilisateurId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPersoUser_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BlogPersoUser" ADD CONSTRAINT "BlogPersoUser_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
