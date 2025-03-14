/*
  Warnings:

  - You are about to drop the column `message` on the `Notification` table. All the data in the column will be lost.
  - Added the required column `blogId` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `titre` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "message",
ADD COLUMN     "blogId" INTEGER NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "isSonor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isTouched" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "titre" TEXT NOT NULL,
ALTER COLUMN "type" SET DEFAULT 'standart';

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
