ALTER TYPE "DisputeType" ADD VALUE 'AGREEMENT_TERMINATION';

CREATE TABLE "AgreementTerminationReview" (
  "id" TEXT NOT NULL,
  "agreementId" TEXT NOT NULL,
  "terminationRequestId" TEXT NOT NULL,
  "reviewerId" TEXT NOT NULL,
  "targetUserId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgreementTerminationReview_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AgreementTerminationReview_terminationRequestId_reviewerId_key" ON "AgreementTerminationReview"("terminationRequestId", "reviewerId");
CREATE INDEX "AgreementTerminationReview_targetUserId_createdAt_idx" ON "AgreementTerminationReview"("targetUserId", "createdAt");
ALTER TABLE "AgreementTerminationReview" ADD CONSTRAINT "AgreementTerminationReview_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgreementTerminationReview" ADD CONSTRAINT "AgreementTerminationReview_terminationRequestId_fkey" FOREIGN KEY ("terminationRequestId") REFERENCES "AgreementTerminationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgreementTerminationReview" ADD CONSTRAINT "AgreementTerminationReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgreementTerminationReview" ADD CONSTRAINT "AgreementTerminationReview_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AgreementPresence" (
  "id" TEXT NOT NULL,
  "agreementId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgreementPresence_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AgreementPresence_agreementId_userId_key" ON "AgreementPresence"("agreementId", "userId");
CREATE INDEX "AgreementPresence_agreementId_seenAt_idx" ON "AgreementPresence"("agreementId", "seenAt");
ALTER TABLE "AgreementPresence" ADD CONSTRAINT "AgreementPresence_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgreementPresence" ADD CONSTRAINT "AgreementPresence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AgreementRejectionEscalation" (
  "id" TEXT NOT NULL,
  "scopeId" TEXT NOT NULL,
  "propertyId" TEXT,
  "listingId" TEXT NOT NULL,
  "propertyTitle" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "landlordId" TEXT NOT NULL,
  "tenantRejections" INTEGER NOT NULL,
  "landlordRejections" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgreementRejectionEscalation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AgreementRejectionEscalation_scopeId_key" ON "AgreementRejectionEscalation"("scopeId");
