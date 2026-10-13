CREATE TYPE "VerificationStatus" AS ENUM (
  'UNVERIFIED',
  'PENDING',
  'APPROVED',
  'REJECTED'
);

CREATE TYPE "VerificationKind" AS ENUM (
  'IDENTITY',
  'HOST',
  'PROPERTY'
);

CREATE TYPE "VerificationChallengeKind" AS ENUM ('PHONE');

ALTER TABLE "User"
  ADD COLUMN "emailVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "phoneVerifiedAt" TIMESTAMP(3);

ALTER TABLE "Property"
  ADD COLUMN "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED';

CREATE INDEX "Property_verificationStatus_status_idx"
  ON "Property"("verificationStatus", "status");

CREATE TABLE "VerificationSubmission" (
  "id" TEXT NOT NULL,
  "activeKey" TEXT,
  "userId" TEXT NOT NULL,
  "propertyId" TEXT,
  "kind" "VerificationKind" NOT NULL,
  "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
  "details" JSONB,
  "evidenceUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "reviewerId" TEXT,
  "reviewNotes" TEXT,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VerificationSubmission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VerificationSubmission_activeKey_key"
  ON "VerificationSubmission"("activeKey");
CREATE INDEX "VerificationSubmission_kind_status_submittedAt_idx"
  ON "VerificationSubmission"("kind", "status", "submittedAt");
CREATE INDEX "VerificationSubmission_userId_kind_submittedAt_idx"
  ON "VerificationSubmission"("userId", "kind", "submittedAt");
CREATE INDEX "VerificationSubmission_propertyId_kind_submittedAt_idx"
  ON "VerificationSubmission"("propertyId", "kind", "submittedAt");

ALTER TABLE "VerificationSubmission"
  ADD CONSTRAINT "VerificationSubmission_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "VerificationSubmission_reviewerId_fkey"
  FOREIGN KEY ("reviewerId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "VerificationSubmission_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "VerificationChallenge" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "kind" "VerificationChallengeKind" NOT NULL,
  "target" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VerificationChallenge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VerificationChallenge_tokenHash_key"
  ON "VerificationChallenge"("tokenHash");
CREATE INDEX "VerificationChallenge_userId_kind_createdAt_idx"
  ON "VerificationChallenge"("userId", "kind", "createdAt");
CREATE INDEX "VerificationChallenge_expiresAt_idx"
  ON "VerificationChallenge"("expiresAt");

ALTER TABLE "VerificationChallenge"
  ADD CONSTRAINT "VerificationChallenge_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
