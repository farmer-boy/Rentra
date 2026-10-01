-- Store geographic coordinates for map search markers.
ALTER TABLE "Listing"
  ADD COLUMN "latitude" DOUBLE PRECISION,
  ADD COLUMN "longitude" DOUBLE PRECISION;
CREATE INDEX "Listing_latitude_longitude_idx" ON "Listing"("latitude", "longitude");
