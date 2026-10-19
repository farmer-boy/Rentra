CREATE TYPE "BoostOrderStatus" AS ENUM (
  'PENDING_PAYMENT',
  'PAID',
  'CANCELLED',
  'FAILED'
);

CREATE TABLE "BoostOrder" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "BoostOrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
  "subtotal" INTEGER NOT NULL,
  "total" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'PKR',
  "idempotencyKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BoostOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BoostOrderItem" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "productName" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitPrice" INTEGER NOT NULL,
  "lineTotal" INTEGER NOT NULL,

  CONSTRAINT "BoostOrderItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BoostOrder_userId_idempotencyKey_key"
  ON "BoostOrder"("userId", "idempotencyKey");
CREATE INDEX "BoostOrder_userId_createdAt_idx"
  ON "BoostOrder"("userId", "createdAt");
CREATE INDEX "BoostOrder_userId_status_idx"
  ON "BoostOrder"("userId", "status");
CREATE INDEX "BoostOrderItem_orderId_idx"
  ON "BoostOrderItem"("orderId");

ALTER TABLE "BoostOrder"
  ADD CONSTRAINT "BoostOrder_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BoostOrderItem"
  ADD CONSTRAINT "BoostOrderItem_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "BoostOrder"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
