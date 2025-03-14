-- CreateTable
CREATE TABLE "WeatherKit" (
    "id" SERIAL NOT NULL,
    "kitTongouId" INTEGER,
    "lon" DOUBLE PRECISION NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "humidity" DOUBLE PRECISION NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "windSpeed" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeatherKit_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WeatherKit" ADD CONSTRAINT "WeatherKit_kitTongouId_fkey" FOREIGN KEY ("kitTongouId") REFERENCES "KitTongou"("id") ON DELETE SET NULL ON UPDATE CASCADE;
