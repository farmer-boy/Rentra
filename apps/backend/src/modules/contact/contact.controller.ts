import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getMessageById(@Param('id') id: string) {
    return this.contactService.getMessageById(id);
  }

  @Patch('message/:id/read')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async markAsRead(@Param('id') id: string) {
    return this.contactService.markAsRead(id);
  }

  @Delete('message/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteMessage(@Param('id') id: string) {
    return this.contactService.deleteMessage(id);
  }
}
