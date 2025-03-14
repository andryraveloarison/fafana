-- CreateTable
CREATE TABLE "KitValeur" (
    "id" SERIAL NOT NULL,
    "t1" DOUBLE PRECISION NOT NULL,
    "t2" DOUBLE PRECISION NOT NULL,
    "t3" DOUBLE PRECISION NOT NULL,
    "t4" DOUBLE PRECISION NOT NULL,
    "kitId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KitValeur_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "KitValeur" ADD CONSTRAINT "KitValeur_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "Kit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
