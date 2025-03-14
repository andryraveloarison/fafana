-- AlterTable
ALTER TABLE "UserAppareil" ADD COLUMN     "compteElectriciteEauId" INTEGER;

-- CreateTable
CREATE TABLE "UtilisateurBlogNotif" (
    "id" SERIAL NOT NULL,
    "utilisateurId" INTEGER,
    "blogId" INTEGER NOT NULL,

    CONSTRAINT "UtilisateurBlogNotif_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UtilisateurBlogNotif" ADD CONSTRAINT "UtilisateurBlogNotif_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UtilisateurBlogNotif" ADD CONSTRAINT "UtilisateurBlogNotif_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAppareil" ADD CONSTRAINT "UserAppareil_compteElectriciteEauId_fkey" FOREIGN KEY ("compteElectriciteEauId") REFERENCES "CompteElectriciteEau"("id") ON DELETE SET NULL ON UPDATE CASCADE;
