-- Add reusable Country > Province > City > Area > Block/Sector hierarchy.
CREATE TYPE "LocationLevel" AS ENUM ('COUNTRY', 'PROVINCE', 'CITY', 'AREA', 'BLOCK_SECTOR');

CREATE TABLE "Location" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "level" "LocationLevel" NOT NULL,
  "parentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Listing" ADD COLUMN "locationId" TEXT;
CREATE UNIQUE INDEX "Location_parentId_slug_key" ON "Location"("parentId", "slug");
CREATE INDEX "Location_level_idx" ON "Location"("level");
CREATE INDEX "Location_parentId_idx" ON "Location"("parentId");
CREATE INDEX "Listing_locationId_idx" ON "Listing"("locationId");
ALTER TABLE "Location" ADD CONSTRAINT "Location_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
