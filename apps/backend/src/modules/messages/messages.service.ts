import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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
  ) {
    if (userId === otherUserId) {
      throw new BadRequestException('Cannot create conversation with yourself');
    }

    // Check if conversation already exists (in either direction)
    const existingConversation = await this.prisma.conversation.findFirst({
      where: {
        OR: [
          { participant1Id: userId, participant2Id: otherUserId },
          { participant1Id: otherUserId, participant2Id: userId },
        ],
      },
      include: {
        participant1: {
          select: { id: true, fullName: true, email: true },
        },
        participant2: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (existingConversation) {
      return existingConversation;
    }

    // Create new conversation
    const conversation = await this.prisma.conversation.create({
      data: {
        participant1Id: userId,
        participant2Id: otherUserId,
        listingId,
      },
      include: {
        participant1: {
          select: { id: true, fullName: true, email: true },
        },
        participant2: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    return conversation;
  }

  // Get all conversations for a user
  async getUserConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [
          { participant1Id: userId },
          { participant2Id: userId },
        ],
      },
      include: {
        participant1: {
          select: { id: true, fullName: true, email: true },
        },
        participant2: {
          select: { id: true, fullName: true, email: true },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    return conversations.map((conv) => ({
      ...conv,
      otherParticipant: conv.participant1Id === userId ? conv.participant2 : conv.participant1,
      lastMessage: conv.messages[0] || null,
    }));
  }

  // Get messages in a conversation
  async getConversationMessages(conversationId: string, userId: string, limit = 50, offset = 0) {
    // Verify user is part of conversation
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      throw new BadRequestException('You are not part of this conversation');
    }

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: { id: true, fullName: true, email: true },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset,
    });

    // Mark messages as read if not from current user
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return messages;
  }

  // Send a message
  async sendMessage(conversationId: string, userId: string, createMessageDto: CreateMessageDto) {
    const { content, attachmentUrl } = createMessageDto;

    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Message content cannot be empty');
    }

    // Verify user is part of conversation
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      throw new BadRequestException('You are not part of this conversation');
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content,
        attachmentUrl,
      },
      include: {
        sender: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    // Update conversation last message time
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    return message;
  }

  // Get unread message count for a user
  async getUnreadCount(userId: string) {
    const unreadCount = await this.prisma.message.count({
      where: {
        conversation: {
          OR: [
            { participant1Id: userId },
            { participant2Id: userId },
          ],
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

    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      throw new BadRequestException('You are not part of this conversation');
    }

    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { success: true };
  }
}
