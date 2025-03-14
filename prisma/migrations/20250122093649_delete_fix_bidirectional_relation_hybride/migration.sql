/*
  Warnings:

  - You are about to drop the `KitTongouHybride` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "KitTongouHybride" DROP CONSTRAINT "KitTongouHybride_kitHybridedId_fkey";

-- DropForeignKey
ALTER TABLE "KitTongouHybride" DROP CONSTRAINT "KitTongouHybride_kitPrincipaleId_fkey";

-- DropTable
DROP TABLE "KitTongouHybride";
