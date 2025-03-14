-- CreateTable
CREATE TABLE "kitNotifStatus" (
    "id" SERIAL NOT NULL,
    "kitId" INTEGER NOT NULL,
    "status1" BOOLEAN NOT NULL DEFAULT false,
    "status2" BOOLEAN NOT NULL DEFAULT false,
    "status3" BOOLEAN NOT NULL DEFAULT false,
    "status4" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kitNotifStatus_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "kitNotifStatus" ADD CONSTRAINT "kitNotifStatus_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "Kit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
