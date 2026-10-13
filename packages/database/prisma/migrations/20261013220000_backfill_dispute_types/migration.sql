UPDATE "Dispute"
SET "type" = 'BOOKING'
WHERE "bookingId" IS NOT NULL
  AND "agreementId" IS NULL;

UPDATE "Dispute"
SET "type" = 'RENTAL_ISSUE'
WHERE "bookingId" IS NULL
  AND "agreementId" IS NULL;
