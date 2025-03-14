/*
  Warnings:

  - You are about to drop the column `consommation` on the `KitTongouAutoReleve` table. All the data in the column will be lost.
  - You are about to drop the column `kitTongouId` on the `KitTongouAutoReleve` table. All the data in the column will be lost.
  - Added the required column `compteElectriciteEauId` to the `KitTongouAutoReleve` table without a default value. This is not possible if the table is not empty.
  - Added the required column `consommationKit` to the `KitTongouAutoReleve` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "KitTongouAutoReleve" DROP CONSTRAINT "KitTongouAutoReleve_kitTongouId_fkey";

-- AlterTable
ALTER TABLE "KitTongouAutoReleve" DROP COLUMN "consommation",
DROP COLUMN "kitTongouId",
ADD COLUMN     "compteElectriciteEauId" INTEGER NOT NULL,
ADD COLUMN     "consommationKit" DOUBLE PRECISION NOT NULL;

-- AddForeignKey
ALTER TABLE "KitTongouAutoReleve" ADD CONSTRAINT "KitTongouAutoReleve_compteElectriciteEauId_fkey" FOREIGN KEY ("compteElectriciteEauId") REFERENCES "CompteElectriciteEau"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
