-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_analyseaiId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_blogId_fkey";

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "blogId" DROP NOT NULL,
ALTER COLUMN "analyseaiId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_analyseaiId_fkey" FOREIGN KEY ("analyseaiId") REFERENCES "Analyseia"("id") ON DELETE SET NULL ON UPDATE CASCADE;
