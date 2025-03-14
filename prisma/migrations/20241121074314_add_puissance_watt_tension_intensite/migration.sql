-- AlterTable
ALTER TABLE "CompteElectriciteEau" ADD COLUMN     "intensite" DOUBLE PRECISION,
ADD COLUMN     "puissanceWatt" DOUBLE PRECISION,
ADD COLUMN     "tension" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "KitTongou" ADD COLUMN     "blocked" BOOLEAN NOT NULL DEFAULT false;
