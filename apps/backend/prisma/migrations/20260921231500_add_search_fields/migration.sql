-- Add search facets for rental period and future availability.
CREATE TYPE "RentalDuration" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'LONG_TERM');
ALTER TABLE "Listing"
  ADD COLUMN "rentalDuration" "RentalDuration" NOT NULL DEFAULT 'MONTHLY',
  ADD COLUMN "availableFrom" TIMESTAMP(3);
CREATE INDEX "Listing_rentalDuration_idx" ON "Listing"("rentalDuration");
CREATE INDEX "Listing_availableFrom_idx" ON "Listing"("availableFrom");
