/*
  Warnings:

  - You are about to drop the column `agenceUser` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `commune` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `titre` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `zoneId` on the `Notification` table. All the data in the column will be lost.
  - Added the required column `message` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "agenceUser",
DROP COLUMN "commune",
DROP COLUMN "description",
DROP COLUMN "titre",
DROP COLUMN "zoneId",
ADD COLUMN     "message" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL;
