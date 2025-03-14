/*
  Warnings:

  - You are about to drop the `UserTest` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Utilisateur" ADD COLUMN     "isValidated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "validationCode" TEXT;

-- DropTable
DROP TABLE "UserTest";
