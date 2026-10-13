ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'PROCESSING';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'SUCCESS';

CREATE TYPE "PaymentProviderType" AS ENUM (
    'JAZZCASH',
    'EASYPAISA',
    'CARD',
    'BANK_TRANSFER',
    'OTHER',
    'LEGACY'
);

ALTER TABLE "Payment"
ADD COLUMN "provider" "PaymentProviderType" NOT NULL DEFAULT 'LEGACY',
ADD COLUMN "idempotencyKey" TEXT,
ADD COLUMN "paidAt" TIMESTAMP(3),
ADD COLUMN "refundTransactionId" TEXT,
ADD COLUMN "dueAt" TIMESTAMP(3);

ALTER TABLE "Payment"
ALTER COLUMN "method" DROP NOT NULL;

DROP INDEX IF EXISTS "Payment_bookingId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "Payment_transactionId_key"
ON "Payment"("transactionId");

CREATE UNIQUE INDEX IF NOT EXISTS "Payment_userId_idempotencyKey_key"
ON "Payment"("tenantId", "idempotencyKey");

CREATE INDEX IF NOT EXISTS "Payment_tenantId_status_idx"
ON "Payment"("tenantId", "status");

CREATE TABLE "PaymentWebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" "PaymentProviderType" NOT NULL,
    "eventId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentWebhookEvent_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PaymentWebhookEvent_paymentId_fkey"
      FOREIGN KEY ("paymentId") REFERENCES "Payment"("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "PaymentWebhookEvent_provider_eventId_key"
ON "PaymentWebhookEvent"("provider", "eventId");

CREATE INDEX "PaymentWebhookEvent_paymentId_receivedAt_idx"
ON "PaymentWebhookEvent"("paymentId", "receivedAt");
