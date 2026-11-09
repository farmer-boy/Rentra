CREATE TYPE "AgreementTerminationRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE "AgreementAmendment" ADD COLUMN "reviewRating" INTEGER;
ALTER TABLE "AgreementAmendment" ADD COLUMN "reviewComment" TEXT;

CREATE TABLE "AgreementTerminationRequest" (
  "id" TEXT NOT NULL,
  "agreementId" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "requestReason" TEXT NOT NULL,
  "status" "AgreementTerminationRequestStatus" NOT NULL DEFAULT 'PENDING',
  "respondedById" TEXT,
  "decisionReason" TEXT,
  "reviewRating" INTEGER,
  "reviewComment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decidedAt" TIMESTAMP(3),
  "pendingAgreementId" TEXT,
  CONSTRAINT "AgreementTerminationRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AgreementTerminationRequest_pendingAgreementId_key" ON "AgreementTerminationRequest"("pendingAgreementId");
CREATE INDEX "AgreementTerminationRequest_agreementId_status_createdAt_idx" ON "AgreementTerminationRequest"("agreementId", "status", "createdAt");

ALTER TABLE "AgreementTerminationRequest" ADD CONSTRAINT "AgreementTerminationRequest_agreementId_fkey"
  FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

