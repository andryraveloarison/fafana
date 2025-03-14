-- AlterTable
ALTER TABLE "CompteElectriciteEau" ADD COLUMN     "activiteEau" TEXT,
ALTER COLUMN "compteurElectricite" DROP NOT NULL,
ALTER COLUMN "tarif" DROP NOT NULL,
ALTER COLUMN "puissance" DROP NOT NULL,
ALTER COLUMN "activite" DROP NOT NULL;
