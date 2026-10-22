import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { ReplySupportTicketDto } from './dto/reply-support-ticket.dto';
import { RestrictSupportDto, SupportActionDto } from './dto/support-action.dto';
import { UpdateSupportTicketStatusDto } from './dto/update-support-ticket-status.dto';
import { SupportService } from './support.service';

const MEMBER_ROLES = [
  'TENANT', 'LANDLORD', 'AGENT', 'HOTEL_MANAGER', 'HOSTEL_MANAGER', 'PROPERTY_MANAGER',
] as const;

@Controller('support')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @Roles(...MEMBER_ROLES)
  createTicket(@CurrentUser() user: JwtPayload, @Body() dto: CreateSupportTicketDto) {
    return this.supportService.createTicket(user.sub, dto);
  }

  @Get('tickets')
  @Roles(...MEMBER_ROLES)
  listMyTickets(@CurrentUser() user: JwtPayload) {
    return this.supportService.listMyTickets(user.sub);
  }

  @Get('tickets/:id')
  @Roles(...MEMBER_ROLES, 'ADMIN')
  getTicket(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.supportService.getTicket(id, user.sub, user.roles?.includes('ADMIN') ?? user.role === 'ADMIN');
  }

  @Post('tickets/:id/replies')
  @Roles(...MEMBER_ROLES, 'ADMIN')
  reply(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ReplySupportTicketDto,
  ) {
    return this.supportService.reply(id, user.sub, user.roles?.includes('ADMIN') ?? user.role === 'ADMIN', dto.body);
  }

  @Get('admin/tickets')
  @Roles('ADMIN')
  listAllTickets(@Query('status') status?: string) {
    return this.supportService.listAllTickets(status);
  }

  @Patch('admin/tickets/:id/status')
  @Roles('ADMIN')
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateSupportTicketStatusDto,
  ) {
    return this.supportService.updateStatus(id, user.sub, dto.status);
  }

  @Post('admin/tickets/:id/warn')
  @Roles('ADMIN')
  warnUser(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() dto: SupportActionDto) {
    return this.supportService.warnUser(id, user.sub, dto.reason);
  }

  @Post('admin/tickets/:id/replies')
  @Roles('ADMIN')
  replyAsAdmin(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ReplySupportTicketDto,
  ) {
    return this.supportService.reply(id, user.sub, true, dto.body);
  }

  @Post('admin/users/:id/restrict')
  @Roles('ADMIN')
  restrictUser(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() dto: RestrictSupportDto) {
    return this.supportService.restrictUser(id, user.sub, dto.reason, dto.durationDays);
  }

  @Post('admin/users/:id/restore')
  @Roles('ADMIN')
  restoreSupport(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() dto: SupportActionDto) {
    return this.supportService.restoreSupport(id, user.sub, dto.reason);
  }
}
