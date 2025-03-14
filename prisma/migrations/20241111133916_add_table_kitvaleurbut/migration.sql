-- CreateTable
CREATE TABLE "KitValeurBut" (
    "id" SERIAL NOT NULL,
    "kitTongouId" INTEGER NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "consommationMin" DOUBLE PRECISION,
    "tranche" DOUBLE PRECISION,
    "pourcentageTranche" TEXT,
    "consommationBut" DOUBLE PRECISION,
    "consommationJour" DOUBLE PRECISION,
    "consommationHeure" DOUBLE PRECISION,
    "msg1" BOOLEAN NOT NULL DEFAULT false,
    "msg2" BOOLEAN NOT NULL DEFAULT false,
    "msg3" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KitValeurBut_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "KitValeurBut" ADD CONSTRAINT "KitValeurBut_kitTongouId_fkey" FOREIGN KEY ("kitTongouId") REFERENCES "KitTongou"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
