ALTER TABLE "Conversation"
  ADD COLUMN IF NOT EXISTS "propertyId" TEXT,
  ADD COLUMN IF NOT EXISTS "bookingId" TEXT;

CREATE INDEX IF NOT EXISTS "Conversation_propertyId_idx"
  ON "Conversation"("propertyId");
CREATE INDEX IF NOT EXISTS "Conversation_bookingId_idx"
  ON "Conversation"("bookingId");

DO $$ BEGIN
  ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;ALTER TABLE "Conversation"
  ADD COLUMN IF NOT EXISTS "propertyId" TEXT,
  ADD COLUMN IF NOT EXISTS "bookingId" TEXT;

CREATE INDEX IF NOT EXISTS "Conversation_propertyId_idx"
  ON "Conversation"("propertyId");
CREATE INDEX IF NOT EXISTS "Conversation_bookingId_idx"
  ON "Conversation"("bookingId");

DO $$ BEGIN
  ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;