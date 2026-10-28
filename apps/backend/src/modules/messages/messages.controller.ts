import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
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
    @Query('propertyId') propertyId?: string,
  ) {
    return this.messagesService.getOrCreateConversation(
      user.sub,
      otherUserId,
      listingId,
      propertyId,
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

  @Patch('conversation/:conversationId/:messageId')
  async updateMessage(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @Body() dto: UpdateMessageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.messagesService.updateMessage(
      conversationId,
      messageId,
      user.sub,
      dto.content,
    );
  }

  @Delete('conversation/:conversationId/:messageId')
  async deleteMessage(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.messagesService.deleteMessage(
      conversationId,
      messageId,
      user.sub,
    );
  }

  @Post('conversation/:conversationId/:messageId/star')
  async setMessageStarred(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @Body('isStarred') isStarred: boolean,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.messagesService.setMessageStarred(conversationId, messageId, user.sub, Boolean(isStarred));
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

  @Post('conversation/:conversationId/unread')
  async markAsUnread(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.messagesService.markConversationAsUnread(conversationId, user.sub);
  }

  @Post('conversation/:conversationId/archive')
  async archiveConversation(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.messagesService.archiveConversation(conversationId, user.sub);
  }

  @Post('conversation/:conversationId/unarchive')
  async unarchiveConversation(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.messagesService.archiveConversation(conversationId, user.sub, false);
  }

  @Post('conversation/:conversationId/mute')
  async muteConversation(
    @Param('conversationId') conversationId: string,
    @Body('duration') duration: number | 'always',
    @CurrentUser() user: JwtPayload,
  ) {
    const normalizedDuration = duration === 'always' ? duration : Number(duration);
    return this.messagesService.muteConversation(conversationId, user.sub, normalizedDuration);
  }

  @Post('conversation/:conversationId/unmute')
  async unmuteConversation(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.messagesService.unmuteConversation(conversationId, user.sub);
  }

  @Post('conversation/:conversationId/favorite')
  async setConversationFavorite(
    @Param('conversationId') conversationId: string,
    @Body('isFavorite') isFavorite: boolean,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.messagesService.setConversationFavorite(conversationId, user.sub, Boolean(isFavorite));
  }

  @Post('conversation/:conversationId/pin')
  async setConversationPinned(@Param('conversationId') conversationId: string, @Body('isPinned') isPinned: boolean, @CurrentUser() user: JwtPayload) {
    return this.messagesService.setConversationPinned(conversationId, user.sub, Boolean(isPinned));
  }

  @Post('conversation/:conversationId/block')
  async setConversationBlocked(@Param('conversationId') conversationId: string, @Body('isBlocked') isBlocked: boolean, @CurrentUser() user: JwtPayload) {
    return this.messagesService.setConversationBlocked(conversationId, user.sub, Boolean(isBlocked));
  }

  @Delete('conversation/:conversationId')
  async deleteConversation(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.messagesService.deleteConversationForUser(conversationId, user.sub);
  }

  @Post('conversation/:conversationId/clear')
  async clearConversation(@Param('conversationId') conversationId: string, @CurrentUser() user: JwtPayload) {
    return this.messagesService.clearConversationForUser(conversationId, user.sub);
  }
}
