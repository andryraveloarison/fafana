-- CreateTable
CREATE TABLE "TypeBlog" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TypeBlog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blog" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "lien" TEXT NOT NULL,
    "reaction" INTEGER NOT NULL,
    "image" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "typeBlogId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Blog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TypeBlog_type_key" ON "TypeBlog"("type");

-- AddForeignKey
ALTER TABLE "Blog" ADD CONSTRAINT "Blog_typeBlogId_fkey" FOREIGN KEY ("typeBlogId") REFERENCES "TypeBlog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
