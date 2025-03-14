-- CreateTable
CREATE TABLE "Appareil" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appareil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValeurAppareil" (
    "id" SERIAL NOT NULL,
    "tension" DOUBLE PRECISION NOT NULL,
    "intensite" DOUBLE PRECISION NOT NULL,
    "consommation" DOUBLE PRECISION NOT NULL,
    "appareilId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ValeurAppareil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TypeAppareil" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TypeAppareil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAppareil" (
    "id" SERIAL NOT NULL,
    "utilisateurId" INTEGER NOT NULL,
    "appareilId" INTEGER NOT NULL,
    "typeAppareilId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAppareil_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ValeurAppareil" ADD CONSTRAINT "ValeurAppareil_appareilId_fkey" FOREIGN KEY ("appareilId") REFERENCES "Appareil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAppareil" ADD CONSTRAINT "UserAppareil_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAppareil" ADD CONSTRAINT "UserAppareil_appareilId_fkey" FOREIGN KEY ("appareilId") REFERENCES "Appareil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAppareil" ADD CONSTRAINT "UserAppareil_typeAppareilId_fkey" FOREIGN KEY ("typeAppareilId") REFERENCES "TypeAppareil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
