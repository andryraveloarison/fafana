/*
  Warnings:

  - You are about to drop the column `typeAppareilId` on the `UserAppareil` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserAppareil" DROP CONSTRAINT "UserAppareil_typeAppareilId_fkey";

-- AlterTable
ALTER TABLE "UserAppareil" DROP COLUMN "typeAppareilId";
