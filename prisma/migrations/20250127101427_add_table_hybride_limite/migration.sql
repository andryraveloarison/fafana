-- CreateTable
CREATE TABLE "KitTongouLimiteHybride" (
    "id" SERIAL NOT NULL,
    "kitTongouId" INTEGER NOT NULL,
    "tranche1" INTEGER,
    "tranche2" INTEGER,
    "tranche3" INTEGER,
    "tranche4" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KitTongouLimiteHybride_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "KitTongouLimiteHybride" ADD CONSTRAINT "KitTongouLimiteHybride_kitTongouId_fkey" FOREIGN KEY ("kitTongouId") REFERENCES "KitTongou"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
