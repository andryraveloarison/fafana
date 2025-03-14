-- DropForeignKey
ALTER TABLE "UserAppareil" DROP CONSTRAINT "UserAppareil_typeAppareilId_fkey";

-- AlterTable
ALTER TABLE "UserAppareil" ALTER COLUMN "typeAppareilId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "UserAppareil" ADD CONSTRAINT "UserAppareil_typeAppareilId_fkey" FOREIGN KEY ("typeAppareilId") REFERENCES "TypeAppareil"("id") ON DELETE SET NULL ON UPDATE CASCADE;
