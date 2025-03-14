/*
  Warnings:

  - You are about to drop the column `image` on the `KitTongou` table. All the data in the column will be lost.
  - You are about to drop the column `public_id` on the `KitTongou` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `KitTongou` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "KitTongou" DROP COLUMN "image",
DROP COLUMN "public_id",
DROP COLUMN "url",
ADD COLUMN     "kitTypeTongouId" INTEGER;

-- CreateTable
CREATE TABLE "KitTypeTongou" (
    "id" SERIAL NOT NULL,
    "marque" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "quantity" INTEGER,
    "prix" DOUBLE PRECISION,
    "image" TEXT,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KitTypeTongou_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "KitTongou" ADD CONSTRAINT "KitTongou_kitTypeTongouId_fkey" FOREIGN KEY ("kitTypeTongouId") REFERENCES "KitTypeTongou"("id") ON DELETE SET NULL ON UPDATE CASCADE;
