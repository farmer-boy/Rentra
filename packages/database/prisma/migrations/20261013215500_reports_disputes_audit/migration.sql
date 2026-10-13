CREATE TYPE "DisputeType" AS ENUM (
  'BOOKING',
  'PAYMENT',
  'AGREEMENT',
  'RENTAL_ISSUE'
);

ALTER TABLE "Report"
  ADD COLUMN "assignedAdminId" TEXT,
  ADD COLUMN "resolutionNote" TEXT,
  ADD COLUMN "resolvedAt" TIMESTAMP(3),
  ADD COLUMN "violationConfirmed" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Dispute"
  ADD COLUMN "paymentId" TEXT,
  ADD COLUMN "type" "DisputeType" NOT NULL DEFAULT 'AGREEMENT',
  ADD COLUMN "assignedAdminId" TEXT,
  ADD COLUMN "resolutionNote" TEXT,
  ADD COLUMN "resolvedAt" TIMESTAMP(3);

ALTER TABLE "Report"
  ADD CONSTRAINT "Report_assignedAdminId_fkey"
  FOREIGN KEY ("assignedAdminId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Dispute"
  ADD CONSTRAINT "Dispute_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "Payment"("id")
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Dispute_assignedAdminId_fkey"
  FOREIGN KEY ("assignedAdminId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Report_reporterId_createdAt_idx"
  ON "Report"("reporterId", "createdAt");
CREATE INDEX "Report_targetType_targetId_status_idx"
  ON "Report"("targetType", "targetId", "status");
CREATE INDEX "Report_assignedAdminId_status_createdAt_idx"
  ON "Report"("assignedAdminId", "status", "createdAt");

CREATE INDEX "Dispute_createdById_createdAt_idx"
  ON "Dispute"("tenantId", "createdAt");
CREATE INDEX "Dispute_paymentId_idx"
  ON "Dispute"("paymentId");
CREATE INDEX "Dispute_assignedAdminId_status_createdAt_idx"
  ON "Dispute"("assignedAdminId", "status", "createdAt");

CREATE TABLE "ModerationAuditEvent" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "actorRole" TEXT,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "previousStatus" TEXT,
  "newStatus" TEXT,
  "reason" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ModerationAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ModerationAuditEvent_entityType_entityId_createdAt_idx"
  ON "ModerationAuditEvent"("entityType", "entityId", "createdAt");
CREATE INDEX "ModerationAuditEvent_actorId_createdAt_idx"
  ON "ModerationAuditEvent"("actorId", "createdAt");

CREATE OR REPLACE FUNCTION "prevent_moderation_audit_mutation"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Moderation audit events are append-only';
END;
$$;

CREATE TRIGGER "ModerationAuditEvent_append_only"
  BEFORE UPDATE OR DELETE OR TRUNCATE ON "ModerationAuditEvent"
  FOR EACH STATEMENT
  EXECUTE FUNCTION "prevent_moderation_audit_mutation"();

COMMENT ON TABLE "ModerationAuditEvent" IS
  'Append-only moderation history. Database ownership and application-role permissions must be restricted separately.';
