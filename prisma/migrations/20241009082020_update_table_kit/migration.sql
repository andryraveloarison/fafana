/*
  Warnings:

  - Added the required column `DMac` to the `Kit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `DeviceModel` to the `Kit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `DeviceType` to the `Kit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `DeviceTypeName` to the `Kit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Name` to the `Kit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Kit" ADD COLUMN     "DMac" TEXT NOT NULL,
ADD COLUMN     "DeviceModel" TEXT NOT NULL,
ADD COLUMN     "DeviceType" TEXT NOT NULL,
ADD COLUMN     "DeviceTypeName" TEXT NOT NULL,
ADD COLUMN     "Name" TEXT NOT NULL;
