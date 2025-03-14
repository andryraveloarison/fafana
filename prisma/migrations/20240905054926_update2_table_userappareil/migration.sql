/*
  Warnings:

  - You are about to drop the column `pseudoAppareil` on the `UserAppareil` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserAppareil" DROP COLUMN "pseudoAppareil",
ADD COLUMN     "pseudoGroupe" TEXT;
