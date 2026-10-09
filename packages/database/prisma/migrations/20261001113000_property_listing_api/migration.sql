DO $$ BEGIN
  CREATE TYPE "PropertyStatus" AS ENUM (
    'DRAFT', 'PENDING_VERIFICATION', 'ACTIVE', 'RENTED', 'EXPIRED', 'REJECTED', 'SUSPENDED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Property" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "propertyType" "PropertyType" NOT NULL,
  "rentalMode" "RentalDuration" NOT NULL DEFAULT 'MONTHLY',
  "price" INTEGER NOT NULL DEFAULT 0,
  "securityDeposit" INTEGER,
  "bedrooms" INTEGER NOT NULL DEFAULT 0,
  "bathrooms" INTEGER NOT NULL DEFAULT 0,
  "areaSizeSqft" INTEGER,
  "furnishedStatus" "FurnishedStatus" NOT NULL DEFAULT 'UNFURNISHED',
  "availability" "ListingAvailability" NOT NULL DEFAULT 'AVAILABLE',
  "rules" TEXT,
  "status" "PropertyStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
  "country" TEXT NOT NULL DEFAULT 'Pakistan',
  "city" TEXT,
  "area" TEXT,
  "address" TEXT NOT NULL,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "locationId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Property"
  ADD COLUMN IF NOT EXISTS "rentalMode" "RentalDuration" NOT NULL DEFAULT 'MONTHLY',
  ADD COLUMN IF NOT EXISTS "price" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "securityDeposit" INTEGER,
  ADD COLUMN IF NOT EXISTS "bedrooms" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "bathrooms" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "areaSizeSqft" INTEGER,
  ADD COLUMN IF NOT EXISTS "furnishedStatus" "FurnishedStatus" NOT NULL DEFAULT 'UNFURNISHED',
  ADD COLUMN IF NOT EXISTS "availability" "ListingAvailability" NOT NULL DEFAULT 'AVAILABLE',
  ADD COLUMN IF NOT EXISTS "rules" TEXT;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'Property'
      AND column_name = 'status'
      AND udt_name <> 'PropertyStatus'
  ) THEN
    ALTER TABLE "Property" ALTER COLUMN "status" DROP DEFAULT;
    ALTER TABLE "Property" ALTER COLUMN "status" TYPE "PropertyStatus"
      USING CASE "status"::text
        WHEN 'DRAFT' THEN 'DRAFT'::"PropertyStatus"
        WHEN 'PUBLISHED' THEN 'ACTIVE'::"PropertyStatus"
        WHEN 'VERIFIED' THEN 'ACTIVE'::"PropertyStatus"
        WHEN 'RENTED' THEN 'RENTED'::"PropertyStatus"
        WHEN 'REMOVED' THEN 'EXPIRED'::"PropertyStatus"
        WHEN 'REJECTED' THEN 'REJECTED'::"PropertyStatus"
        WHEN 'SUSPENDED' THEN 'SUSPENDED'::"PropertyStatus"
        ELSE 'PENDING_VERIFICATION'::"PropertyStatus"
      END;
    ALTER TABLE "Property" ALTER COLUMN "status" SET DEFAULT 'PENDING_VERIFICATION';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "PropertyManager" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PropertyManager_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "propertyId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "PropertyManager_propertyId_userId_key"
  ON "PropertyManager"("propertyId", "userId");
CREATE INDEX IF NOT EXISTS "PropertyManager_userId_idx"
  ON "PropertyManager"("userId");
CREATE INDEX IF NOT EXISTS "Property_propertyType_status_idx"
  ON "Property"("propertyType", "status");
CREATE INDEX IF NOT EXISTS "Property_rentalMode_status_idx"
  ON "Property"("rentalMode", "status");
CREATE INDEX IF NOT EXISTS "Property_price_idx" ON "Property"("price");
CREATE INDEX IF NOT EXISTS "Property_locationId_idx" ON "Property"("locationId");
CREATE INDEX IF NOT EXISTS "Listing_propertyId_idx" ON "Listing"("propertyId");

DO $$ BEGIN
  ALTER TABLE "Property" ADD CONSTRAINT "Property_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "Property" ADD CONSTRAINT "Property_locationId_fkey"
    FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "PropertyManager" ADD CONSTRAINT "PropertyManager_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "PropertyManager" ADD CONSTRAINT "PropertyManager_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "Listing" ADD CONSTRAINT "Listing_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;