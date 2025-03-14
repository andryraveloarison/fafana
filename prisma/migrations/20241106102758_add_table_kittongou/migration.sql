-- CreateTable
CREATE TABLE "KitTongou" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "online" BOOLEAN NOT NULL DEFAULT false,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KitTongou_pkey" PRIMARY KEY ("id")
);
