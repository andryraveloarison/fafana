/*
  Warnings:

  - You are about to drop the column `index` on the `AutoReleve` table. All the data in the column will be lost.
  - You are about to drop the column `indexAjouter` on the `AutoReleve` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `AutoReleve` table. All the data in the column will be lost.
  - Added the required column `ancienIndex` to the `AutoReleve` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dateAncienIndex` to the `AutoReleve` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dateNouveauIndex` to the `AutoReleve` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nouveauIndex` to the `AutoReleve` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prix` to the `AutoReleve` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalConsommation` to the `AutoReleve` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AutoReleve" DROP COLUMN "index",
DROP COLUMN "indexAjouter",
DROP COLUMN "total",
ADD COLUMN     "ancienIndex" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "dateAncienIndex" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "dateNouveauIndex" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "nouveauIndex" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "prix" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "totalConsommation" DOUBLE PRECISION NOT NULL;
