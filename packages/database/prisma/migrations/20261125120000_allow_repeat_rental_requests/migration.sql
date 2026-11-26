DROP INDEX IF EXISTS "RentalRequest_listingId_tenantId_key";

CREATE INDEX IF NOT EXISTS "RentalRequest_listingId_tenantId_idx"
  ON "RentalRequest"("listingId", "tenantId");
