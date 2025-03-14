-- AlterTable
ALTER TABLE "TypeAppareil" ADD COLUMN     "utilisateurId" INTEGER;

-- AddForeignKey
ALTER TABLE "TypeAppareil" ADD CONSTRAINT "TypeAppareil_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;
