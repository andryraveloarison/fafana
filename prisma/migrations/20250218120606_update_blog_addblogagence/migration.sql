-- AlterTable
ALTER TABLE "Blog" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'default';

-- CreateTable
CREATE TABLE "BlogAgence" (
    "id" SERIAL NOT NULL,
    "agence" TEXT,
    "blogId" INTEGER NOT NULL,

    CONSTRAINT "BlogAgence_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BlogAgence" ADD CONSTRAINT "BlogAgence_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
