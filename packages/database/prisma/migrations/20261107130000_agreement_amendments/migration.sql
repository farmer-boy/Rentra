CREATE TYPE "AgreementAmendmentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

CREATE TABLE "AgreementAmendment" (
  "id" TEXT NOT NULL,
  "agreementId" TEXT NOT NULL,
  "proposedById" TEXT NOT NULL,
  "proposedMonthlyRent" INTEGER NOT NULL,
  "proposedSecurityDeposit" INTEGER NOT NULL,
  "reason" TEXT,
  "status" "AgreementAmendmentStatus" NOT NULL DEFAULT 'PENDING',
  "decidedById" TEXT,
  "decisionNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decidedAt" TIMESTAMP(3),
  "pendingAgreementId" TEXT,
  CONSTRAINT "AgreementAmendment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AgreementAmendment_pendingAgreementId_key" ON "AgreementAmendment"("pendingAgreementId");
CREATE INDEX "AgreementAmendment_agreementId_status_createdAt_idx" ON "AgreementAmendment"("agreementId", "status", "createdAt");

ALTER TABLE "AgreementAmendment" ADD CONSTRAINT "AgreementAmendment_agreementId_fkey"
  FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
