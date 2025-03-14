/*
  Warnings:

  - You are about to drop the column `appareilId` on the `UserAppareil` table. All the data in the column will be lost.
  - You are about to drop the column `pseudoGroupe` on the `UserAppareil` table. All the data in the column will be lost.
  - You are about to drop the column `typeAppareilId` on the `UserAppareil` table. All the data in the column will be lost.
  - You are about to drop the `TypeAppareil` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `kitId` to the `UserAppareil` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "TypeAppareil" DROP CONSTRAINT "TypeAppareil_utilisateurId_fkey";

-- DropForeignKey
ALTER TABLE "UserAppareil" DROP CONSTRAINT "UserAppareil_typeAppareilId_fkey";

-- AlterTable
ALTER TABLE "UserAppareil" DROP COLUMN "appareilId",
DROP COLUMN "pseudoGroupe",
DROP COLUMN "typeAppareilId",
ADD COLUMN     "kitId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "TypeAppareil";

-- CreateTable
CREATE TABLE "Kit" (
    "id" SERIAL NOT NULL,
    "DID" INTEGER NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kit_pkey" PRIMARY KEY ("id")
);
