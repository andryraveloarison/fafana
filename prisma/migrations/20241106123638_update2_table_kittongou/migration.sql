/*
  Warnings:

  - You are about to drop the column `idTongou` on the `KitTongou` table. All the data in the column will be lost.
  - Added the required column `idKitTongou` to the `KitTongou` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "KitTongou" DROP COLUMN "idTongou",
ADD COLUMN     "idKitTongou" TEXT NOT NULL;
