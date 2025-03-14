-- DropForeignKey
ALTER TABLE "KitValeurBut" DROP CONSTRAINT "KitValeurBut_modeGestionId_fkey";

-- AlterTable
ALTER TABLE "KitValeurBut" ALTER COLUMN "modeGestionId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "KitValeurBut" ADD CONSTRAINT "KitValeurBut_modeGestionId_fkey" FOREIGN KEY ("modeGestionId") REFERENCES "ModeGestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
