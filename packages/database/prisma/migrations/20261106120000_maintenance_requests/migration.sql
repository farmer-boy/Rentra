CREATE TYPE "MaintenanceRequestCategory" AS ENUM (
  'PLUMBING',
  'ELECTRICAL',
  'APPLIANCE',
  'STRUCTURAL',
  'CLEANING',
  'OTHER'
);

CREATE TYPE "MaintenanceRequestStatus" AS ENUM (
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED'
);

CREATE TYPE "MaintenanceRequestPriority" AS ENUM ('NORMAL', 'URGENT');

CREATE TABLE "MaintenanceRequest" (
  "id" TEXT NOT NULL,
  "agreementId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "landlordId" TEXT NOT NULL,
  "category" "MaintenanceRequestCategory" NOT NULL,
  "priority" "MaintenanceRequestPriority" NOT NULL DEFAULT 'NORMAL',
  "status" "MaintenanceRequestStatus" NOT NULL DEFAULT 'OPEN',
  "subject" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MaintenanceRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MaintenanceRequest_tenantId_status_createdAt_idx"
  ON "MaintenanceRequest"("tenantId", "status", "createdAt");
CREATE INDEX "MaintenanceRequest_landlordId_status_createdAt_idx"
  ON "MaintenanceRequest"("landlordId", "status", "createdAt");
CREATE INDEX "MaintenanceRequest_propertyId_status_idx"
  ON "MaintenanceRequest"("propertyId", "status");
CREATE INDEX "MaintenanceRequest_agreementId_idx"
  ON "MaintenanceRequest"("agreementId");

ALTER TABLE "MaintenanceRequest"
  ADD CONSTRAINT "MaintenanceRequest_agreementId_fkey"
    FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "MaintenanceRequest_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "MaintenanceRequest_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "MaintenanceRequest_landlordId_fkey"
    FOREIGN KEY ("landlordId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
