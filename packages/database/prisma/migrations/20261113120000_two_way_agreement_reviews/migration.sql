ALTER TABLE "Review"
  ALTER COLUMN "rating" TYPE DOUBLE PRECISION USING "rating"::DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "tenantId" TEXT,
  ADD COLUMN IF NOT EXISTS "behaviour" INTEGER,
  ADD COLUMN IF NOT EXISTS "propertyCondition" INTEGER,
  ADD COLUMN IF NOT EXISTS "honesty" INTEGER,
  ADD COLUMN IF NOT EXISTS "maintenance" INTEGER,
  ADD COLUMN IF NOT EXISTS "responseTime" INTEGER,
  ADD COLUMN IF NOT EXISTS "rentPayment" INTEGER,
  ADD COLUMN IF NOT EXISTS "propertyCare" INTEGER,
  ADD COLUMN IF NOT EXISTS "agreementCompliance" INTEGER,
  ADD COLUMN IF NOT EXISTS "wouldRecommend" BOOLEAN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Review_tenantId_fkey'
      AND conrelid = '"Review"'::regclass
  ) THEN
    ALTER TABLE "Review"
      ADD CONSTRAINT "Review_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Review_rating_range_check'
      AND conrelid = '"Review"'::regclass
  ) THEN
    ALTER TABLE "Review"
      ADD CONSTRAINT "Review_rating_range_check"
      CHECK ("rating" >= 1 AND "rating" <= 5);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Review_tenantId_createdAt_idx"
  ON "Review"("tenantId", "createdAt");
