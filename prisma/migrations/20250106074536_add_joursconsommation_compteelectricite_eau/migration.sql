-- AlterTable
ALTER TABLE "CompteElectriciteEau" ADD COLUMN     "joursConsommation" INTEGER;

-- AlterTable
ALTER TABLE "_ExpertTypeExpert" ADD CONSTRAINT "_ExpertTypeExpert_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ExpertTypeExpert_AB_unique";
