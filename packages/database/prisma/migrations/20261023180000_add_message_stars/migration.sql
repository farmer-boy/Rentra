CREATE TABLE "MessageStar" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MessageStar_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MessageStar_messageId_userId_key" ON "MessageStar"("messageId", "userId");
CREATE INDEX "MessageStar_userId_createdAt_idx" ON "MessageStar"("userId", "createdAt");
ALTER TABLE "MessageStar" ADD CONSTRAINT "MessageStar_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessageStar" ADD CONSTRAINT "MessageStar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
