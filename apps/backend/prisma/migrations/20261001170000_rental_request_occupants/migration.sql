ALTER TABLE "RentalRequest"
  ADD COLUMN IF NOT EXISTS "occupants" INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS "RentalRequest_propertyId_status_idx"
  ON "RentalRequest"("propertyId", "status");