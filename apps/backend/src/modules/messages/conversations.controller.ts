import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesService } from './messages.service';

class MessagePageQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset = 0;
}

@ApiTags('conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Create or return a conversation with a user' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateConversationDto) {
    return this.messagesService.createConversation(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List conversations the current user belongs to' })
  list(@CurrentUser() user: JwtPayload) {
    return this.messagesService.getUserConversations(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a conversation and its last message' })
  getById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.messagesService.getConversation(id, user.sub);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send text and/or an image URL in a conversation' })
  sendMessage(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.messagesService.sendMessage(id, user.sub, dto);
  }

  @Get(':id/messages')
  @ApiOperation({
    summary: 'Get conversation messages and mark incoming messages read',
  })
  getMessages(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query() query: MessagePageQuery,
  ) {
    return this.messagesService.getConversationMessages(
      id,
      user.sub,
      query.limit,
      query.offset,
    );
  }
}
