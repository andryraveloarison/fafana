/*
  Warnings:

  - You are about to drop the column `dateOffline` on the `Kit` table. All the data in the column will be lost.
  - You are about to drop the column `kitOnOff` on the `Kit` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Kit" DROP COLUMN "dateOffline",
DROP COLUMN "kitOnOff";

-- AlterTable
ALTER TABLE "KitTongou" ADD COLUMN     "dateOffline" TIMESTAMP(3),
ADD COLUMN     "kitOnOff" BOOLEAN NOT NULL DEFAULT false;
