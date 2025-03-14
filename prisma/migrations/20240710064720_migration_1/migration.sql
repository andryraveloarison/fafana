-- CreateTable
CREATE TABLE "Province" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Province_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zone" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "provinceId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TypeUser" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TypeUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "pseudo" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" INTEGER NOT NULL,
    "image" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "typeUserId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

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
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "facebook" TEXT NOT NULL,
    "linkdin" TEXT NOT NULL,
    "certification" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "stat" INTEGER NOT NULL,
    "zoneId" INTEGER NOT NULL,
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
CREATE UNIQUE INDEX "Province_nom_key" ON "Province"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Zone_nom_key" ON "Zone"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "TypeUser_type_key" ON "TypeUser"("type");

-- CreateIndex
CREATE UNIQUE INDEX "TypeExpert_type_key" ON "TypeExpert"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Expert_nom_key" ON "Expert"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "_ExpertTypeExpert_AB_unique" ON "_ExpertTypeExpert"("A", "B");

-- CreateIndex
CREATE INDEX "_ExpertTypeExpert_B_index" ON "_ExpertTypeExpert"("B");

-- AddForeignKey
ALTER TABLE "Zone" ADD CONSTRAINT "Zone_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_typeUserId_fkey" FOREIGN KEY ("typeUserId") REFERENCES "TypeUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expert" ADD CONSTRAINT "Expert_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExpertTypeExpert" ADD CONSTRAINT "_ExpertTypeExpert_A_fkey" FOREIGN KEY ("A") REFERENCES "Expert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExpertTypeExpert" ADD CONSTRAINT "_ExpertTypeExpert_B_fkey" FOREIGN KEY ("B") REFERENCES "TypeExpert"("id") ON DELETE CASCADE ON UPDATE CASCADE;
