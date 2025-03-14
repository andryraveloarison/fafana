/*
  Warnings:

  - You are about to drop the `Appareil` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ValeurAppareil` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserAppareil" DROP CONSTRAINT "UserAppareil_appareilId_fkey";

-- DropForeignKey
ALTER TABLE "ValeurAppareil" DROP CONSTRAINT "ValeurAppareil_appareilId_fkey";

-- DropTable
DROP TABLE "Appareil";

-- DropTable
DROP TABLE "ValeurAppareil";
