import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  // Get or create conversation with another user
  @Post('conversation/:otherUserId')
  async getOrCreateConversation(
    @CurrentUser() user: JwtPayload,
    @Param('otherUserId') otherUserId: string,
    @Query('listingId') listingId?: string,
  ) {
    return this.messagesService.getOrCreateConversation(
      user.sub,
      otherUserId,
      listingId,
    );
  }

  // Get all conversations for current user
  @Get('conversations')
  async getUserConversations(@CurrentUser() user: JwtPayload) {
    return this.messagesService.getUserConversations(user.sub);
  }

  // Get messages in a conversation
  @Get('conversation/:conversationId')
  async getConversationMessages(
    @CurrentUser() user: JwtPayload,
    @Param('conversationId') conversationId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.messagesService.getConversationMessages(
      conversationId,
      user.sub,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
  }

  // Send a message
  @Post('conversation/:conversationId/send')
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() createMessageDto: CreateMessageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.messagesService.sendMessage(
      conversationId,
      user.sub,
      createMessageDto,
    );
  }

  // Get unread message count
  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: JwtPayload) {
    return this.messagesService.getUnreadCount(user.sub);
  }

  @Get('notifications')
  async getNotifications(@CurrentUser() user: JwtPayload) {
    return this.messagesService.getNotifications(user.sub);
  }

  @Post('notifications/:notificationId/read')
  async markNotificationRead(
    @Param('notificationId') notificationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.messagesService.markNotificationRead(notificationId, user.sub);
  }

  // Mark conversation as read
  @Post('conversation/:conversationId/read')
  async markAsRead(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.messagesService.markConversationAsRead(
      conversationId,
      user.sub,
    );
  }
}
