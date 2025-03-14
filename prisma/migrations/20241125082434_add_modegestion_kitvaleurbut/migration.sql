-- AlterTable
ALTER TABLE "KitValeurBut" ADD COLUMN     "modeGestionId" INTEGER;

-- AddForeignKey
ALTER TABLE "KitValeurBut" ADD CONSTRAINT "KitValeurBut_modeGestionId_fkey" FOREIGN KEY ("modeGestionId") REFERENCES "ModeGestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
