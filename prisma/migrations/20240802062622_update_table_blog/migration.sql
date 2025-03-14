-- AlterTable
ALTER TABLE "Blog" ADD COLUMN     "zoneId" INTEGER;

-- AddForeignKey
ALTER TABLE "Blog" ADD CONSTRAINT "Blog_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
