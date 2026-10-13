CREATE UNIQUE INDEX IF NOT EXISTS "Payment_booking_success_unique"
ON "Payment"("bookingId")
WHERE "bookingId" IS NOT NULL
  AND "provider" <> 'LEGACY'
  AND "status" IN ('SUCCESS', 'PAID');

CREATE UNIQUE INDEX IF NOT EXISTS "Payment_agreement_period_success_unique"
ON "Payment"("agreementId", "month")
WHERE "agreementId" IS NOT NULL
  AND "month" IS NOT NULL
  AND "provider" <> 'LEGACY'
  AND "status" IN ('SUCCESS', 'PAID');
