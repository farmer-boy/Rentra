CREATE TYPE "AgreementActivityType" AS ENUM (
  'AMENDMENT_PROPOSAL',
  'AMENDMENT_RESPONSE',
  'TERMINATION_REQUEST',
  'TERMINATION_RESPONSE',
  'TERMINATION_REVIEW'
);

CREATE TABLE "AgreementActivityVisibility" (
  "id" TEXT NOT NULL,
  "agreementId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "eventType" "AgreementActivityType" NOT NULL,
  "eventId" TEXT NOT NULL,
  "clearedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgreementActivityVisibility_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AgreementActivityVisibility_agreementId_userId_eventType_eventId_key"
  ON "AgreementActivityVisibility"("agreementId", "userId", "eventType", "eventId");
CREATE INDEX "AgreementActivityVisibility_agreementId_userId_clearedAt_idx"
  ON "AgreementActivityVisibility"("agreementId", "userId", "clearedAt");

ALTER TABLE "AgreementActivityVisibility" ADD CONSTRAINT "AgreementActivityVisibility_agreementId_fkey"
  FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgreementActivityVisibility" ADD CONSTRAINT "AgreementActivityVisibility_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
