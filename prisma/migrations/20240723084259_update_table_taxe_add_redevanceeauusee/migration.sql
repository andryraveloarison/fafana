/*
  Warnings:

  - Added the required column `redevanceeauusee` to the `Taxe` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Taxe" ADD COLUMN     "redevanceeauusee" INTEGER NOT NULL;
