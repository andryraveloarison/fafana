/*
  Warnings:

  - Made the column `typeAppareilId` on table `UserAppareil` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "UserAppareil" DROP CONSTRAINT "UserAppareil_typeAppareilId_fkey";

-- AlterTable
ALTER TABLE "UserAppareil" ALTER COLUMN "typeAppareilId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "UserAppareil" ADD CONSTRAINT "UserAppareil_typeAppareilId_fkey" FOREIGN KEY ("typeAppareilId") REFERENCES "TypeAppareil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
