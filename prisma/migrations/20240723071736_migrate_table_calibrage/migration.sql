-- CreateTable
CREATE TABLE "Calibrage" (
    "id" SERIAL NOT NULL,
    "calibrage" INTEGER NOT NULL,
    "redevance" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Calibrage_pkey" PRIMARY KEY ("id")
);
