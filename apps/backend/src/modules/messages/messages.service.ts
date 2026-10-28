import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  // Get or create conversation between two users
  async getOrCreateConversation(
    userId: string,
    otherUserId: string,
    listingId?: string,
    propertyId?: string,
    bookingId?: string,
  ) {
    if (userId === otherUserId) {
      throw new BadRequestException('Cannot create conversation with yourself');
    }

    const orderedParticipants =
      userId < otherUserId
        ? { participant1Id: userId, participant2Id: otherUserId }
        : { participant1Id: otherUserId, participant2Id: userId };

    const context = await this.validateConversationContext(
      userId,
      otherUserId,
      listingId,
      propertyId,
      bookingId,
    );

    const existingConversation = await this.prisma.conversation.findFirst({
      where: {
        ...orderedParticipants,
        listingId: context.listingId ?? null,
        propertyId: context.propertyId ?? null,
        bookingId: context.bookingId ?? null,
      },
      include: this.conversationInclude(),
    });

    if (existingConversation) {
      return existingConversation;
    }

    // Create new conversation
    const conversation = await this.prisma.conversation.create({
      data: {
        ...orderedParticipants,
        listingId: context.listingId,
        propertyId: context.propertyId,
        bookingId: context.bookingId,
      },
      include: this.conversationInclude(),
    });

    return conversation;
  }

  async createConversation(userId: string, dto: CreateConversationDto) {
    return this.getOrCreateConversation(
      userId,
      dto.otherUserId,
      dto.listingId,
      dto.propertyId,
      dto.bookingId,
    );
  }

  // Get all conversations for a user
  async getUserConversations(userId: string) {
    const currentUser = await this.prisma.user.findUnique({ where: { id: userId }, select: { roles: true } });
    const favorites = await this.prisma.$queryRaw<Array<{ conversationId: string }>>`
      SELECT "conversationId"
      FROM "ConversationUserState"
      WHERE "userId" = ${userId} AND "isFavorite" = true
    `;
    const favoriteConversationIds = new Set(favorites.map(({ conversationId }) => conversationId));
    const pinnedStates = await this.prisma.$queryRaw<Array<{ conversationId: string; isPinned: boolean; isBlocked: boolean; clearedAt: Date | null }>>`
      SELECT "conversationId", "isPinned", "isBlocked", "clearedAt"
      FROM "ConversationUserState" WHERE "userId" = ${userId}
    `;
    const stateByConversation = new Map(pinnedStates.map((state) => [state.conversationId, state]));
    const activeMutes = await this.prisma.$queryRaw<Array<{ conversationId: string; mutedUntil: Date | null }>>`
      SELECT "conversationId", "mutedUntil"
      FROM "ConversationUserState"
      WHERE "userId" = ${userId} AND "isMuted" = true
        AND ("mutedUntil" IS NULL OR "mutedUntil" > CURRENT_TIMESTAMP)
    `;
    const mutedUntilByConversation = new Map(activeMutes.map(({ conversationId, mutedUntil }) => [conversationId, mutedUntil]));
    const mutedConversationIds = new Set(activeMutes.map(({ conversationId }) => conversationId));
    // Inbox delivery means the message has reached the recipient's account.
    await this.prisma.message.updateMany({
      where: {
        senderId: { not: userId },
        isDelivered: false,
        conversation: {
          OR: [{ participant1Id: userId }, { participant2Id: userId }],
        },
      },
      data: { isDelivered: true },
    });

    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
      },
      include: {
        participant1: { select: { id: true, fullName: true, roles: true } },
        participant2: { select: { id: true, fullName: true, roles: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            messages: {
              where: { senderId: { not: userId }, isRead: false },
            },
          },
        },
        listing: { select: { id: true, title: true, city: true, area: true } },
        property: { select: { id: true, title: true, city: true, area: true } },
        booking: {
          select: { id: true, startDate: true, endDate: true, status: true },
        },
        userStates: { where: { userId } },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    return conversations
      .filter((conv) => !currentUser?.roles.includes('ADMIN') || (!conv.participant1.roles.includes('ADMIN') && !conv.participant2.roles.includes('ADMIN')))
      .filter((conv) => !conv.userStates[0]?.deletedAt)
      .map((conv) => {
      const { userStates, ...conversation } = conv;
      return {
      ...conversation,
      otherParticipant:
        conv.participant1Id === userId ? conv.participant2 : conv.participant1,
      lastMessage: conv.messages[0] && (!stateByConversation.get(conv.id)?.clearedAt || conv.messages[0].createdAt > stateByConversation.get(conv.id)!.clearedAt!) ? conv.messages[0] : null,
      unreadCount: stateByConversation.get(conv.id)?.clearedAt && conv.messages[0] && conv.messages[0].createdAt <= stateByConversation.get(conv.id)!.clearedAt! ? 0 : conv._count.messages,
      isArchived: Boolean(userStates[0]?.archivedAt),
      isFavorite: favoriteConversationIds.has(conv.id),
      isPinned: Boolean(stateByConversation.get(conv.id)?.isPinned),
      isBlocked: Boolean(stateByConversation.get(conv.id)?.isBlocked),
      mutedUntil: mutedUntilByConversation.get(conv.id) ?? null,
      isMuted: mutedConversationIds.has(conv.id),
      };
      });
  }

  async getConversation(conversationId: string, userId: string) {
    await this.assertParticipant(conversationId, userId);
    return this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        ...this.conversationInclude(),
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: { sender: { select: { id: true, fullName: true } } },
        },
      },
    });
  }

  private async assertParticipant(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        participant1Id: true,
        participant2Id: true,
        createdAt: true,
        participant1: { select: { roles: true } },
        participant2: { select: { roles: true } },
      },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (
      conversation.participant1Id !== userId &&
      conversation.participant2Id !== userId
    ) {
      throw new ForbiddenException('You are not part of this conversation');
    }
    const requestingUserIsAdmin = userId === conversation.participant1Id
      ? conversation.participant1.roles.includes('ADMIN')
      : conversation.participant2.roles.includes('ADMIN');
    if (requestingUserIsAdmin) {
      throw new ForbiddenException(
        'Direct messages with admins are disabled. Please use Help & Support.',
      );
    }
    return conversation;
  }

  private async validateConversationContext(
    userId: string,
    otherUserId: string,
    listingId?: string,
    propertyId?: string,
    bookingId?: string,
  ): Promise<{ listingId?: string; propertyId?: string; bookingId?: string }> {
    const otherUser = await this.prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, roles: true },
    });
    if (!otherUser)
      throw new NotFoundException('Conversation participant not found');
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true },
    });
    if (
      otherUser.roles.includes('ADMIN') ||
      currentUser?.roles.includes('ADMIN')
    ) {
      throw new ForbiddenException(
        'Direct messages with admins are disabled. Please use Help & Support.',
      );
    }

    if (bookingId) {
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          property: { include: { managers: { select: { userId: true } } } },
          listing: {
            include: {
              landlord: { select: { id: true } },
              property: { include: { managers: { select: { userId: true } } } },
            },
          },
        },
      });
      if (!booking) throw new NotFoundException('Booking not found');

      const bookingPropertyId =
        booking.propertyId ?? booking.listing?.propertyId ?? undefined;
      if (propertyId && bookingPropertyId && propertyId !== bookingPropertyId) {
        throw new BadRequestException(
          'Property does not match the supplied booking',
        );
      }
      if (listingId && booking.listingId && listingId !== booking.listingId) {
        throw new BadRequestException(
          'Listing does not match the supplied booking',
        );
      }

      const managerIds = [
        ...(booking.property?.managers.map((manager) => manager.userId) ?? []),
        ...(booking.listing?.property?.managers.map(
          (manager) => manager.userId,
        ) ?? []),
      ];
      const ownerIds = [
        ...(booking.property ? [booking.property.ownerId] : []),
        ...(booking.listing ? [booking.listing.landlord.id] : []),
        ...managerIds,
      ];
      const allowedParticipants = new Set([booking.tenantId, ...ownerIds]);
      if (
        !allowedParticipants.has(userId) ||
        !allowedParticipants.has(otherUserId)
      ) {
        throw new ForbiddenException(
          'Only booking participants may start this conversation',
        );
      }
      if (userId === otherUserId) {
        throw new BadRequestException(
          'Cannot create conversation with yourself',
        );
      }

      propertyId ??= bookingPropertyId;
      listingId ??= booking.listingId ?? undefined;
    }

    if (propertyId) {
      const property = await this.prisma.property.findUnique({
        where: { id: propertyId },
        include: { managers: { select: { userId: true } } },
      });
      if (!property || (property.status !== 'ACTIVE' && !bookingId)) {
        throw new NotFoundException('Active property not found');
      }
      const propertyParticipants = new Set([
        property.ownerId,
        ...property.managers.map((manager) => manager.userId),
      ]);
      if (
        !propertyParticipants.has(userId) &&
        !propertyParticipants.has(otherUserId)
      ) {
        throw new ForbiddenException(
          'A property owner or assigned manager must participate',
        );
      }
    }

    if (listingId) {
      const listing = await this.prisma.listing.findUnique({
        where: { id: listingId },
        select: { id: true, landlordId: true, propertyId: true },
      });
      if (!listing) throw new NotFoundException('Listing not found');
      if (
        propertyId &&
        listing.propertyId &&
        listing.propertyId !== propertyId
      ) {
        throw new BadRequestException(
          'Listing does not belong to the supplied property',
        );
      }
      if (userId !== listing.landlordId && otherUserId !== listing.landlordId) {
        throw new ForbiddenException(
          'A listing owner must participate in this conversation',
        );
      }
    }

    return { listingId, propertyId, bookingId };
  }

  private conversationInclude() {
    return {
      participant1: { select: { id: true, fullName: true, roles: true } },
      participant2: { select: { id: true, fullName: true, roles: true } },
      listing: { select: { id: true, title: true, city: true, area: true } },
      property: { select: { id: true, title: true, city: true, area: true } },
      booking: {
        select: { id: true, startDate: true, endDate: true, status: true },
      },
    };
  }

  // Get messages in a conversation
  async getConversationMessages(
    conversationId: string,
    userId: string,
    limit = 50,
    offset = 0,
  ) {
    await this.assertParticipant(conversationId, userId);
    const safeLimit = Math.max(1, Math.min(limit, 100));
    const safeOffset = Math.max(0, offset);

    const state = await this.prisma.$queryRaw<Array<{ clearedAt: Date | null }>>`
      SELECT "clearedAt" FROM "ConversationUserState"
      WHERE "conversationId" = ${conversationId} AND "userId" = ${userId}
      LIMIT 1
    `;
    const clearedAt = state[0]?.clearedAt;
    await this.prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, isRead: false, ...(clearedAt ? { createdAt: { gt: clearedAt } } : {}) },
      data: {
        isDelivered: true,
        isRead: true,
        updatedAt: new Date(),
      },
    });

    const [messages, starredMessages] = await Promise.all([this.prisma.message.findMany({
      where: { conversationId, ...(clearedAt ? { createdAt: { gt: clearedAt } } : {}) },
      include: {
        sender: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: safeLimit,
      skip: safeOffset,
    }), this.prisma.$queryRaw<Array<{ messageId: string }>>`
      SELECT star."messageId" FROM "MessageStar" star
      JOIN "Message" message ON message."id" = star."messageId"
      WHERE star."userId" = ${userId} AND message."conversationId" = ${conversationId}
    `]);
    const starredMessageIds = new Set(starredMessages.map(({ messageId }) => messageId));
    return messages.map((message) => ({ ...message, isStarred: starredMessageIds.has(message.id) }));
  }

  async setMessageStarred(conversationId: string, messageId: string, userId: string, isStarred: boolean) {
    await this.assertParticipant(conversationId, userId);
    const message = await this.prisma.message.findFirst({ where: { id: messageId, conversationId }, select: { id: true } });
    if (!message) throw new NotFoundException('Message not found');
    if (isStarred) {
      await this.prisma.$executeRaw`
        INSERT INTO "MessageStar" ("id", "messageId", "userId")
        VALUES (${randomUUID()}, ${messageId}, ${userId})
        ON CONFLICT ("messageId", "userId") DO NOTHING
      `;
    } else {
      await this.prisma.$executeRaw`
        DELETE FROM "MessageStar" WHERE "messageId" = ${messageId} AND "userId" = ${userId}
      `;
    }
    return { success: true, isStarred };
  }

  // Send a message
  async sendMessage(
    conversationId: string,
    userId: string,
    createMessageDto: CreateMessageDto,
  ) {
    const { content, attachmentUrl } = createMessageDto;

    const normalizedContent = content?.trim() ?? '';
    const normalizedAttachment = attachmentUrl?.trim();
    if (!normalizedContent && !normalizedAttachment) {
      throw new BadRequestException(
        'Message text or image attachment is required',
      );
    }

    // Verify user is part of conversation
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');
    if (
      conversation.participant1Id !== userId &&
      conversation.participant2Id !== userId
    ) {
      throw new ForbiddenException('You are not part of this conversation');
    }

    const recipientId =
      conversation.participant1Id === userId
        ? conversation.participant2Id
        : conversation.participant1Id;

    const blockState = await this.prisma.$queryRaw<Array<{ blocked: boolean }>>`
      SELECT EXISTS (
        SELECT 1 FROM "ConversationUserState"
        WHERE "conversationId" = ${conversationId}
          AND (("userId" = ${userId} AND "isBlocked" = true)
            OR ("userId" = ${recipientId} AND "isBlocked" = true))
      ) AS blocked
    `;
    if (blockState[0]?.blocked) {
      throw new ForbiddenException('Messaging is blocked for this conversation');
    }

    const recipient = await this.prisma.user.findUnique({ where: { id: recipientId }, select: { roles: true } });
    if (recipient?.roles.includes('ADMIN')) {
      throw new ForbiddenException('This is an official notice inbox. Replies are disabled.');
    }

    return this.prisma.$transaction(async (transaction) => {
      const message = await transaction.message.create({
        data: {
          conversationId,
          senderId: userId,
          content: normalizedContent,
          attachmentUrl: normalizedAttachment,
          // A successful send persists the message and creates the recipient's
          // inbox notification in this transaction, so it is delivered even
          // before the recipient opens the conversation.
          isDelivered: true,
        },
        include: { sender: { select: { id: true, fullName: true } } },
      });

      await transaction.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: message.createdAt },
      });

      const activeMute = await transaction.$queryRaw<Array<{ isMuted: boolean }>>`
        SELECT "isMuted"
        FROM "ConversationUserState"
        WHERE "conversationId" = ${conversationId}
          AND "userId" = ${recipientId}
          AND "isMuted" = true
          AND ("mutedUntil" IS NULL OR "mutedUntil" > CURRENT_TIMESTAMP)
        LIMIT 1
      `;
      if (activeMute.length === 0) await transaction.notification.create({
        data: {
          userId: recipientId,
          type: 'NEW_MESSAGE',
          title: 'New message',
          message: normalizedContent
            ? `${message.sender.fullName} sent you a message`
            : `${message.sender.fullName} sent you an image`,
          data: {
            conversationId,
            propertyId: conversation.propertyId,
            bookingId: conversation.bookingId,
            listingId: conversation.listingId,
          },
        },
      });

      await transaction.conversationUserState.upsert({
        where: { conversationId_userId: { conversationId, userId: recipientId } },
        create: { conversationId, userId: recipientId },
        update: { archivedAt: null, deletedAt: null, snoozedUntil: null },
      });

      return message;
    });
  }

  async updateMessage(
    conversationId: string,
    messageId: string,
    userId: string,
    content: string,
  ) {
    await this.assertParticipant(conversationId, userId);
    const normalizedContent = content.trim();
    if (!normalizedContent) {
      throw new BadRequestException('Message text cannot be empty');
    }
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, conversationId: true, senderId: true },
    });
    if (!message || message.conversationId !== conversationId) {
      throw new NotFoundException('Message not found');
    }
    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }
    return this.prisma.message.update({
      where: { id: messageId },
      data: { content: normalizedContent },
      include: { sender: { select: { id: true, fullName: true } } },
    });
  }

  async deleteMessage(conversationId: string, messageId: string, userId: string) {
    const conversation = await this.assertParticipant(conversationId, userId);
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, conversationId: true, senderId: true },
    });
    if (!message || message.conversationId !== conversationId) {
      throw new NotFoundException('Message not found');
    }
    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }
    await this.prisma.message.delete({ where: { id: messageId } });
    const latestMessage = await this.prisma.message.findFirst({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: latestMessage?.createdAt ?? conversation.createdAt },
    });
    return { success: true, messageId };
  }

  // Get unread message count for a user
  async getUnreadCount(userId: string) {
    const [result] = await this.prisma.$queryRaw<Array<{ unreadCount: number }>>`
      SELECT COUNT(message."id")::int AS "unreadCount"
      FROM "Message" AS message
      INNER JOIN "Conversation" AS conversation ON conversation."id" = message."conversationId"
      LEFT JOIN "ConversationUserState" AS state
        ON state."conversationId" = conversation."id" AND state."userId" = ${userId}
      WHERE (conversation."participant1Id" = ${userId} OR conversation."participant2Id" = ${userId})
        AND message."senderId" <> ${userId}
        AND message."isRead" = false
        AND (state."isMuted" IS NOT TRUE OR (state."mutedUntil" IS NOT NULL AND state."mutedUntil" <= CURRENT_TIMESTAMP))
    `;

    return { unreadCount: result?.unreadCount ?? 0 };
  }

  // Mark conversation as read
  async markConversationAsRead(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (
      conversation.participant1Id !== userId &&
      conversation.participant2Id !== userId
    ) {
      throw new ForbiddenException('You are not part of this conversation');
    }

    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: {
        isDelivered: true,
        isRead: true,
        updatedAt: new Date(),
      },
    });

    return { success: true };
  }

  async markConversationAsUnread(conversationId: string, userId: string) {
    await this.assertParticipant(conversationId, userId);
    const latestIncoming = await this.prisma.message.findFirst({
      where: { conversationId, senderId: { not: userId } },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (latestIncoming) {
      await this.prisma.message.update({
        where: { id: latestIncoming.id },
        data: { isRead: false },
      });
    }
    return { success: true };
  }

  async archiveConversation(conversationId: string, userId: string, archived = true) {
    await this.assertParticipant(conversationId, userId);
    await this.prisma.conversationUserState.upsert({
      where: { conversationId_userId: { conversationId, userId } },
      create: { conversationId, userId, archivedAt: archived ? new Date() : null },
      update: { archivedAt: archived ? new Date() : null },
    });
    return { success: true };
  }

  async muteConversation(conversationId: string, userId: string, duration: number | 'always') {
    await this.assertParticipant(conversationId, userId);
    if (duration !== 'always' && ![1, 8, 24, 168].includes(duration)) {
      throw new BadRequestException('Mute duration must be 1, 8, 24, 168 hours, or always');
    }
    const mutedUntil = duration === 'always' ? null : new Date(Date.now() + duration * 60 * 60 * 1000);
    await this.prisma.$executeRaw`
      INSERT INTO "ConversationUserState" ("id", "conversationId", "userId", "mutedUntil", "isMuted", "updatedAt")
      VALUES (${randomUUID()}, ${conversationId}, ${userId}, ${mutedUntil}, true, CURRENT_TIMESTAMP)
      ON CONFLICT ("conversationId", "userId")
      DO UPDATE SET "mutedUntil" = EXCLUDED."mutedUntil", "isMuted" = true, "updatedAt" = CURRENT_TIMESTAMP
    `;
    return { success: true, mutedUntil };
  }

  async unmuteConversation(conversationId: string, userId: string) {
    await this.assertParticipant(conversationId, userId);
    await this.prisma.$executeRaw`
      UPDATE "ConversationUserState" SET "mutedUntil" = NULL, "isMuted" = false, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "conversationId" = ${conversationId} AND "userId" = ${userId}
    `;
    return { success: true };
  }

  async setConversationFavorite(conversationId: string, userId: string, isFavorite: boolean) {
    await this.assertParticipant(conversationId, userId);
    await this.prisma.$executeRaw`
      INSERT INTO "ConversationUserState" ("id", "conversationId", "userId", "isFavorite", "updatedAt")
      VALUES (${randomUUID()}, ${conversationId}, ${userId}, ${isFavorite}, CURRENT_TIMESTAMP)
      ON CONFLICT ("conversationId", "userId")
      DO UPDATE SET "isFavorite" = EXCLUDED."isFavorite", "updatedAt" = CURRENT_TIMESTAMP
    `;
    return { success: true, isFavorite };
  }

  async setConversationPinned(conversationId: string, userId: string, isPinned: boolean) {
    await this.assertParticipant(conversationId, userId);
    await this.prisma.$executeRaw`
      INSERT INTO "ConversationUserState" ("id", "conversationId", "userId", "isPinned", "updatedAt")
      VALUES (${randomUUID()}, ${conversationId}, ${userId}, ${isPinned}, CURRENT_TIMESTAMP)
      ON CONFLICT ("conversationId", "userId")
      DO UPDATE SET "isPinned" = EXCLUDED."isPinned", "updatedAt" = CURRENT_TIMESTAMP
    `;
    return { success: true, isPinned };
  }

  async setConversationBlocked(conversationId: string, userId: string, isBlocked: boolean) {
    await this.assertParticipant(conversationId, userId);
    await this.prisma.$executeRaw`
      INSERT INTO "ConversationUserState" ("id", "conversationId", "userId", "isBlocked", "updatedAt")
      VALUES (${randomUUID()}, ${conversationId}, ${userId}, ${isBlocked}, CURRENT_TIMESTAMP)
      ON CONFLICT ("conversationId", "userId")
      DO UPDATE SET "isBlocked" = EXCLUDED."isBlocked", "updatedAt" = CURRENT_TIMESTAMP
    `;
    return { success: true, isBlocked };
  }

  async deleteConversationForUser(conversationId: string, userId: string) {
    await this.assertParticipant(conversationId, userId);
    await this.prisma.conversationUserState.upsert({
      where: { conversationId_userId: { conversationId, userId } },
      create: { conversationId, userId, deletedAt: new Date() },
      update: { deletedAt: new Date() },
    });
    return { success: true };
  }

  async clearConversationForUser(conversationId: string, userId: string) {
    await this.assertParticipant(conversationId, userId);
    const clearedAt = new Date();
    await this.prisma.$executeRaw`
      INSERT INTO "ConversationUserState" ("id", "conversationId", "userId", "clearedAt", "updatedAt")
      VALUES (${randomUUID()}, ${conversationId}, ${userId}, ${clearedAt}, CURRENT_TIMESTAMP)
      ON CONFLICT ("conversationId", "userId")
      DO UPDATE SET "clearedAt" = EXCLUDED."clearedAt", "updatedAt" = CURRENT_TIMESTAMP
    `;
    await this.prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, isRead: false, createdAt: { lte: clearedAt } },
      data: { isRead: true, isDelivered: true, updatedAt: clearedAt },
    });
    return { success: true, clearedAt };
  }

  async getNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markNotificationRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }
}
