/*
  Warnings:

  - You are about to drop the `Litige` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Service` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Litige" DROP CONSTRAINT "Litige_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "Litige" DROP CONSTRAINT "Litige_utilisateurId_fkey";

-- AlterTable
ALTER TABLE "Kit" ADD COLUMN     "kitTypeId" INTEGER NOT NULL DEFAULT 1;

-- DropTable
DROP TABLE "Litige";

-- DropTable
DROP TABLE "Service";

-- CreateTable
CREATE TABLE "KitType" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KitType_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Kit" ADD CONSTRAINT "Kit_kitTypeId_fkey" FOREIGN KEY ("kitTypeId") REFERENCES "KitType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
