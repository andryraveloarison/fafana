-- CreateTable
CREATE TABLE "KitTongouAutoReleve" (
    "id" SERIAL NOT NULL,
    "kitTongouId" INTEGER NOT NULL,
    "index" DOUBLE PRECISION NOT NULL,
    "consommation" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "indexAjouter" DOUBLE PRECISION NOT NULL,
    "reste" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KitTongouAutoReleve_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "KitTongouAutoReleve" ADD CONSTRAINT "KitTongouAutoReleve_kitTongouId_fkey" FOREIGN KEY ("kitTongouId") REFERENCES "KitTongou"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
