-- Keep separate conversations for the same users when discussing different properties.
DROP INDEX IF EXISTS "Conversation_participant1Id_participant2Id_key";
CREATE UNIQUE INDEX "Conversation_participant1Id_participant2Id_listingId_key" ON "Conversation"("participant1Id", "participant2Id", "listingId");
CREATE INDEX "Conversation_participant1Id_participant2Id_idx" ON "Conversation"("participant1Id", "participant2Id");
