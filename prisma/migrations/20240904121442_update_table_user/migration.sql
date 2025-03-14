-- AlterTable
ALTER TABLE "UserAppareil" ADD COLUMN     "typeAppareilId" INTEGER;

-- AddForeignKey
ALTER TABLE "UserAppareil" ADD CONSTRAINT "UserAppareil_typeAppareilId_fkey" FOREIGN KEY ("typeAppareilId") REFERENCES "TypeAppareil"("id") ON DELETE SET NULL ON UPDATE CASCADE;
