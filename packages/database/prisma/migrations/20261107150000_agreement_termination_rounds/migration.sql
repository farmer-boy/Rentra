ALTER TYPE "AgreementTerminationRequestStatus" ADD VALUE 'CLOSED';

CREATE TYPE "AgreementTerminationResponseDecision" AS ENUM ('APPROVED', 'REJECTED', 'ACCEPTED_REJECTION', 'CONTESTED');

CREATE TABLE "AgreementTerminationResponse" (
  "id" TEXT NOT NULL,
  "terminationRequestId" TEXT NOT NULL,
  "responderId" TEXT NOT NULL,
  "decision" "AgreementTerminationResponseDecision" NOT NULL,
  "reason" TEXT,
  "reviewRating" INTEGER,
  "reviewComment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgreementTerminationResponse_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AgreementTerminationResponse_terminationRequestId_createdAt_idx" ON "AgreementTerminationResponse"("terminationRequestId", "createdAt");
CREATE INDEX "AgreementTerminationResponse_decision_createdAt_idx" ON "AgreementTerminationResponse"("decision", "createdAt");

ALTER TABLE "AgreementTerminationResponse" ADD CONSTRAINT "AgreementTerminationResponse_terminationRequestId_fkey"
  FOREIGN KEY ("terminationRequestId") REFERENCES "AgreementTerminationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
