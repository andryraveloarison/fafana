-- AlterTable
ALTER TABLE "KitTongou" ADD COLUMN     "KitGroupeTongouId" INTEGER;

-- CreateTable
CREATE TABLE "KitGroupeTongou" (
    "id" SERIAL NOT NULL,
    "groupe" TEXT NOT NULL,
    "utilisateurId" INTEGER,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KitGroupeTongou_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "KitTongou" ADD CONSTRAINT "KitTongou_KitGroupeTongouId_fkey" FOREIGN KEY ("KitGroupeTongouId") REFERENCES "KitGroupeTongou"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitGroupeTongou" ADD CONSTRAINT "KitGroupeTongou_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;
