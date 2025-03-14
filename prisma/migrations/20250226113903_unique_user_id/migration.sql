/*
  Warnings:

  - A unique constraint covering the columns `[utilisateurId]` on the table `Simulationia` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Simulationia_utilisateurId_key" ON "Simulationia"("utilisateurId");
