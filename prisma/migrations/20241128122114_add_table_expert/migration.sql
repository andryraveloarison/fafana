-- CreateTable
CREATE TABLE "TypeExpert" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TypeExpert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expert" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "tel1" TEXT NOT NULL,
    "tel2" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ExpertTypeExpert" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "TypeExpert_type_key" ON "TypeExpert"("type");

-- CreateIndex
CREATE UNIQUE INDEX "_ExpertTypeExpert_AB_unique" ON "_ExpertTypeExpert"("A", "B");

-- CreateIndex
CREATE INDEX "_ExpertTypeExpert_B_index" ON "_ExpertTypeExpert"("B");

-- AddForeignKey
ALTER TABLE "_ExpertTypeExpert" ADD CONSTRAINT "_ExpertTypeExpert_A_fkey" FOREIGN KEY ("A") REFERENCES "Expert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExpertTypeExpert" ADD CONSTRAINT "_ExpertTypeExpert_B_fkey" FOREIGN KEY ("B") REFERENCES "TypeExpert"("id") ON DELETE CASCADE ON UPDATE CASCADE;
