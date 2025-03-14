-- CreateTable
CREATE TABLE "KitTongouHybride" (
    "kitPrincipaleId" INTEGER NOT NULL,
    "kitHybridedId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KitTongouHybride_pkey" PRIMARY KEY ("kitPrincipaleId","kitHybridedId")
);

-- AddForeignKey
ALTER TABLE "KitTongouHybride" ADD CONSTRAINT "KitTongouHybride_kitPrincipaleId_fkey" FOREIGN KEY ("kitPrincipaleId") REFERENCES "KitTongou"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitTongouHybride" ADD CONSTRAINT "KitTongouHybride_kitHybridedId_fkey" FOREIGN KEY ("kitHybridedId") REFERENCES "KitTongou"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
