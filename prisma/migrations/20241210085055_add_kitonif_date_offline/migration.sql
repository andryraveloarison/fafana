-- AlterTable
ALTER TABLE "Kit" ADD COLUMN     "dateOffline" TIMESTAMP(3),
ADD COLUMN     "kitOnOff" BOOLEAN NOT NULL DEFAULT false;
