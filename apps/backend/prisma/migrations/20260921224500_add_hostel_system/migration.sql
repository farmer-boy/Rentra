-- Add hostel-specific building, facility, capacity, and room inventory data.
CREATE TYPE "HostelGenderPolicy" AS ENUM ('MALE', 'FEMALE', 'MIXED');

CREATE TABLE "HostelDetails" (
  "id" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "buildingName" TEXT NOT NULL,
  "genderPolicy" "HostelGenderPolicy" NOT NULL,
  "bedCapacity" INTEGER NOT NULL,
  "availableBeds" INTEGER NOT NULL,
  "messIncluded" BOOLEAN NOT NULL DEFAULT false,
  "wifiIncluded" BOOLEAN NOT NULL DEFAULT false,
  "laundryIncluded" BOOLEAN NOT NULL DEFAULT false,
  "electricityIncluded" BOOLEAN NOT NULL DEFAULT false,
  "securityIncluded" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HostelDetails_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HostelRoom" (
  "id" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "roomNumber" TEXT NOT NULL,
  "capacity" INTEGER NOT NULL,
  "availableBeds" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HostelRoom_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HostelDetails_listingId_key" ON "HostelDetails"("listingId");
CREATE UNIQUE INDEX "HostelRoom_listingId_roomNumber_key" ON "HostelRoom"("listingId", "roomNumber");
CREATE INDEX "HostelRoom_listingId_idx" ON "HostelRoom"("listingId");
ALTER TABLE "HostelDetails" ADD CONSTRAINT "HostelDetails_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HostelRoom" ADD CONSTRAINT "HostelRoom_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
