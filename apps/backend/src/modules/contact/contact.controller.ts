import { Controller, Post, Get, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactMessageDto } from './dto/create-contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private contactService: ContactService) {}

  @Post('message')
  async createMessage(@Body() dto: CreateContactMessageDto) {
    return this.contactService.createMessage(dto);
  }

  @Get('messages')
  async getAllMessages(
    @Query('status') status?: string,
    @Query('read') read?: boolean,
  ) {
    const messages = await this.contactService.getAllMessages({
      status,
      read,
    });
    return {
      success: true,
      data: messages,
    };
  }

  @Get('message/:id')
  async getMessageById(@Param('id') id: string) {
    return this.contactService.getMessageById(id);
  }

  @Patch('message/:id/read')
  async markAsRead(@Param('id') id: string) {
    return this.contactService.markAsRead(id);
  }

  @Delete('message/:id')
  async deleteMessage(@Param('id') id: string) {
    return this.contactService.deleteMessage(id);
  }
}
