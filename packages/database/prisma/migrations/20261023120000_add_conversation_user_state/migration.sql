CREATE TABLE "ConversationUserState" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "snoozedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationUserState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ConversationUserState_conversationId_userId_key"
ON "ConversationUserState"("conversationId", "userId");

CREATE INDEX "ConversationUserState_userId_archivedAt_deletedAt_snoozedUntil_idx"
ON "ConversationUserState"("userId", "archivedAt", "deletedAt", "snoozedUntil");

ALTER TABLE "ConversationUserState"
ADD CONSTRAINT "ConversationUserState_conversationId_fkey"
FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ConversationUserState"
ADD CONSTRAINT "ConversationUserState_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
