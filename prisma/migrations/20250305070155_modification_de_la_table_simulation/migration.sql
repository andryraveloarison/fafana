/*
  Warnings:

  - You are about to drop the column `simulation` on the `Simulationia` table. All the data in the column will be lost.
  - Added the required column `consommation` to the `Simulationia` table without a default value. This is not possible if the table is not empty.
  - Added the required column `depense` to the `Simulationia` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nbAdulte` to the `Simulationia` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nbEnfant` to the `Simulationia` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recommandation` to the `Simulationia` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tarif` to the `Simulationia` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPersonne` to the `Simulationia` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Simulationia" DROP COLUMN "simulation",
ADD COLUMN     "consommation" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "depense" TEXT NOT NULL,
ADD COLUMN     "nbAdulte" INTEGER NOT NULL,
ADD COLUMN     "nbEnfant" INTEGER NOT NULL,
ADD COLUMN     "recommandation" TEXT NOT NULL,
ADD COLUMN     "tarif" INTEGER NOT NULL,
ADD COLUMN     "totalPersonne" INTEGER NOT NULL;
