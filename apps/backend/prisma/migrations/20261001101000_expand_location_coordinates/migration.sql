ALTER TYPE "LocationLevel" ADD VALUE IF NOT EXISTS 'NEARBY_LANDMARK';

ALTER TABLE "Location"
  ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS "Location_latitude_longitude_idx"
  ON "Location"("latitude", "longitude");