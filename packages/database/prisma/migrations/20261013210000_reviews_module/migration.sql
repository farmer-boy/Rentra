CREATE TYPE "ReviewType" AS ENUM ('PROPERTY', 'LANDLORD');

ALTER TABLE "Review"
ADD COLUMN "landlordId" TEXT,
ADD COLUMN "reviewType" "ReviewType" NOT NULL DEFAULT 'PROPERTY',
ADD COLUMN "cleanliness" INTEGER,
ADD COLUMN "location" INTEGER,
ADD COLUMN "accuracy" INTEGER,
ADD COLUMN "communication" INTEGER,
ADD COLUMN "facilities" INTEGER;

DROP INDEX "Review_listingId_userId_key";
DROP INDEX "Review_propertyId_userId_key";

CREATE UNIQUE INDEX "Review_bookingId_userId_reviewType_key"
ON "Review"("bookingId", "userId", "reviewType");
CREATE UNIQUE INDEX "Review_agreementId_userId_reviewType_key"
ON "Review"("agreementId", "userId", "reviewType");

CREATE INDEX "Review_listingId_reviewType_createdAt_idx"
ON "Review"("listingId", "reviewType", "createdAt");
CREATE INDEX "Review_propertyId_reviewType_createdAt_idx"
ON "Review"("propertyId", "reviewType", "createdAt");
CREATE INDEX "Review_landlordId_createdAt_idx"
ON "Review"("landlordId", "createdAt");
CREATE INDEX "Review_userId_createdAt_idx"
ON "Review"("userId", "createdAt");
CREATE INDEX "Review_bookingId_idx" ON "Review"("bookingId");
CREATE INDEX "Review_agreementId_idx" ON "Review"("agreementId");

ALTER TABLE "Review"
ADD CONSTRAINT "Review_landlordId_fkey"
FOREIGN KEY ("landlordId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
