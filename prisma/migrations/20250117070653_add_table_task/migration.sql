-- CreateTable
CREATE TABLE "KitTongouTask" (
    "id" SERIAL NOT NULL,
    "kitTongouId" INTEGER NOT NULL,
    "aliasName" TEXT,
    "date" TEXT NOT NULL,
    "enable" BOOLEAN NOT NULL DEFAULT true,
    "value" BOOLEAN NOT NULL DEFAULT false,
    "loops" TEXT NOT NULL,
    "timerId" INTEGER NOT NULL,
    "timezoneId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KitTongouTask_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "KitTongouTask" ADD CONSTRAINT "KitTongouTask_kitTongouId_fkey" FOREIGN KEY ("kitTongouId") REFERENCES "KitTongou"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
