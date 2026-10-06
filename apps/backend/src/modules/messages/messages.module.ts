import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { ConversationsController } from './conversations.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [MessagesService],
  controllers: [MessagesController, ConversationsController],
  exports: [MessagesService],
})
export class MessagesModule {}
