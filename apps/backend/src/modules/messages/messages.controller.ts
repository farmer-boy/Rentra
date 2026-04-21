import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  // Get or create conversation with another user
  @Post('conversation/:otherUserId')
  async getOrCreateConversation(
    @Param('otherUserId') otherUserId: string,
    @Query('listingId') listingId?: string,
    @Request() req?: any,
  ) {
    return this.messagesService.getOrCreateConversation(
      req.user.id,
      otherUserId,
      listingId,
    );
  }

  // Get all conversations for current user
  @Get('conversations')
  async getUserConversations(@Request() req: any) {
    return this.messagesService.getUserConversations(req.user.id);
  }

  // Get messages in a conversation
  @Get('conversation/:conversationId')
  async getConversationMessages(
    @Param('conversationId') conversationId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Request() req?: any,
  ) {
    return this.messagesService.getConversationMessages(
      conversationId,
      req.user.id,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
  }

  // Send a message
  @Post('conversation/:conversationId/send')
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() createMessageDto: CreateMessageDto,
    @Request() req: any,
  ) {
    return this.messagesService.sendMessage(
      conversationId,
      req.user.id,
      createMessageDto,
    );
  }

  // Get unread message count
  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    return this.messagesService.getUnreadCount(req.user.id);
  }

  // Mark conversation as read
  @Post('conversation/:conversationId/read')
  async markAsRead(
    @Param('conversationId') conversationId: string,
    @Request() req: any,
  ) {
    return this.messagesService.markConversationAsRead(conversationId, req.user.id);
  }
}
