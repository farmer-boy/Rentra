import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
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
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
      },
      include: {
        participant1: { select: { id: true, fullName: true } },
        participant2: { select: { id: true, fullName: true } },
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
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    return conversations.map((conv) => ({
      ...conv,
      otherParticipant:
        conv.participant1Id === userId ? conv.participant2 : conv.participant1,
      lastMessage: conv.messages[0] || null,
      unreadCount: conv._count.messages,
    }));
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
      select: { participant1Id: true, participant2Id: true },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (
      conversation.participant1Id !== userId &&
      conversation.participant2Id !== userId
    ) {
      throw new ForbiddenException('You are not part of this conversation');
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
      select: { id: true },
    });
    if (!otherUser)
      throw new NotFoundException('Conversation participant not found');

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
      participant1: { select: { id: true, fullName: true } },
      participant2: { select: { id: true, fullName: true } },
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

    await this.prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, isRead: false },
      data: { isRead: true },
    });

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: safeLimit,
      skip: safeOffset,
    });
    return messages;
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

    return this.prisma.$transaction(async (transaction) => {
      const message = await transaction.message.create({
        data: {
          conversationId,
          senderId: userId,
          content: normalizedContent,
          attachmentUrl: normalizedAttachment,
        },
        include: { sender: { select: { id: true, fullName: true } } },
      });

      await transaction.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: message.createdAt },
      });

      await transaction.notification.create({
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

      return message;
    });
  }

  // Get unread message count for a user
  async getUnreadCount(userId: string) {
    const unreadCount = await this.prisma.message.count({
      where: {
        conversation: {
          OR: [{ participant1Id: userId }, { participant2Id: userId }],
        },
        senderId: { not: userId },
        isRead: false,
      },
    });

    return { unreadCount };
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
        isRead: true,
        updatedAt: new Date(),
      },
    });

    return { success: true };
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
