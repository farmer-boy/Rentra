import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationType,
  Prisma,
  Role,
  SupportTicketCategory,
  SupportTicketStatus,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';

const ACTIVE_STATUSES = [SupportTicketStatus.NEW, SupportTicketStatus.OPEN, SupportTicketStatus.PENDING];
const MAX_OPEN_TICKETS = 3;
const MAX_TICKETS_PER_DAY = 3;

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createTicket(userId: string, dto: CreateSupportTicketDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { supportBlockedUntil: true },
    });
    if (!user) throw new NotFoundException('User not found');
    this.assertSupportAvailable(user.supportBlockedUntil);

    const now = new Date();
    const [activeCount, recentCount] = await Promise.all([
      this.prisma.supportTicket.count({
        where: { userId, status: { in: ACTIVE_STATUSES } },
      }),
      this.prisma.supportTicket.count({
        where: { userId, createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
      }),
    ]);
    if (activeCount >= MAX_OPEN_TICKETS) {
      throw new BadRequestException('You can have up to 3 open support tickets at a time.');
    }
    if (recentCount >= MAX_TICKETS_PER_DAY) {
      throw new BadRequestException('You have reached the limit of 3 support tickets in 24 hours.');
    }

    const ticket = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.supportTicket.create({
        data: {
          userId,
          category: dto.category,
          subject: dto.subject.trim(),
          messages: {
            create: { senderId: userId, body: dto.message.trim() },
          },
        },
        include: this.ticketInclude(),
      });
      await this.notifyAdmins(transaction, {
        title: 'New support ticket',
        message: `${created.user.fullName} opened: ${created.subject}`,
        ticketId: created.id,
      });
      return created;
    });
    return ticket;
  }

  async listMyTickets(userId: string) {
    const [items, user] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where: { userId },
        include: this.ticketInclude(),
        orderBy: { updatedAt: 'desc' },
        take: 100,
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { supportBlockedUntil: true, supportWarningCount: true },
      }),
    ]);
    return {
      items,
      supportBlockedUntil: user?.supportBlockedUntil ?? null,
      supportWarningCount: user?.supportWarningCount ?? 0,
    };
  }

  listAllTickets(status?: string) {
    if (status && !Object.values(SupportTicketStatus).includes(status as SupportTicketStatus)) {
      throw new BadRequestException('Invalid support ticket status');
    }
    return this.prisma.supportTicket.findMany({
      where: status ? { status: status as SupportTicketStatus } : undefined,
      include: this.ticketInclude(),
      orderBy: { updatedAt: 'desc' },
      take: 250,
    });
  }

  async getTicket(ticketId: string, userId: string, isAdmin: boolean) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: this.ticketInclude(),
    });
    if (!ticket) throw new NotFoundException('Support ticket not found');
    if (!isAdmin && ticket.userId !== userId) {
      throw new ForbiddenException('You can only view your own support tickets');
    }
    if (isAdmin && ticket.status === SupportTicketStatus.NEW) {
      return this.prisma.$transaction(async (transaction) => {
        const opened = await transaction.supportTicket.update({
          where: { id: ticketId },
          data: { status: SupportTicketStatus.OPEN },
          include: this.ticketInclude(),
        });
        await transaction.notification.create({
          data: {
            userId: ticket.userId,
            type: NotificationType.SYSTEM,
            title: 'Support opened your ticket',
            message: `Your ticket “${ticket.subject}” has been opened and is waiting for support.`,
            data: { ticketId, href: '/dashboard/support' },
          },
        });
        await this.auditService.record(transaction, {
          actorId: userId,
          actorRole: Role.ADMIN,
          entityType: 'USER',
          entityId: ticket.userId,
          action: 'SUPPORT_TICKET_OPENED',
          previousStatus: SupportTicketStatus.NEW,
          newStatus: SupportTicketStatus.OPEN,
          reason: `Admin opened support ticket: ${ticket.subject}`,
          metadata: { ticketId },
        });
        return opened;
      });
    }
    return ticket;
  }

  async reply(ticketId: string, userId: string, isAdmin: boolean, body: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { user: { select: { id: true, fullName: true } } },
    });
    if (!ticket) throw new NotFoundException('Support ticket not found');
    if (!isAdmin && ticket.userId !== userId) {
      throw new ForbiddenException('You can only reply to your own support tickets');
    }
    if (!isAdmin) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { supportBlockedUntil: true },
      });
      this.assertSupportAvailable(user?.supportBlockedUntil ?? null);
    }

    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: isAdmin ? SupportTicketStatus.PENDING : SupportTicketStatus.OPEN,
          messages: { create: { senderId: userId, body: body.trim() } },
        },
        include: this.ticketInclude(),
      });

      if (isAdmin) {
        await transaction.notification.create({
          data: {
            userId: ticket.userId,
            type: NotificationType.SYSTEM,
            title: 'Support replied to your ticket',
            message: `There is a new reply on “${ticket.subject}”.`,
            data: { ticketId, href: '/dashboard/support' },
          },
        });
      } else {
        await this.notifyAdmins(transaction, {
          title: 'User replied to a support ticket',
          message: `${ticket.user.fullName} replied to: ${ticket.subject}`,
          ticketId,
        });
      }
      return updated;
    });
  }

  async updateStatus(ticketId: string, adminId: string, status: SupportTicketStatus) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true, userId: true, subject: true, status: true },
    });
    if (!ticket) throw new NotFoundException('Support ticket not found');
    const updated = await this.prisma.$transaction(async (transaction) => {
      const result = await transaction.supportTicket.update({
        where: { id: ticketId },
        data: { status },
        include: this.ticketInclude(),
      });
      await this.auditService.record(transaction, {
        actorId: adminId,
        actorRole: Role.ADMIN,
        entityType: 'USER',
        entityId: ticket.userId,
        action: 'SUPPORT_TICKET_STATUS_CHANGED',
        previousStatus: ticket.status,
        newStatus: status,
        reason: `Support ticket ${ticket.id}: ${ticket.subject}`,
        metadata: { ticketId: ticket.id },
      });
      return result;
    });
    if (status === SupportTicketStatus.RESOLVED && ticket.status !== status) {
      await this.prisma.notification.create({
        data: {
          userId: ticket.userId,
          type: NotificationType.SYSTEM,
          title: 'Support ticket resolved',
          message: `Your ticket “${ticket.subject}” has been marked resolved.`,
          data: { ticketId, href: '/dashboard/support' },
        },
      });
    }
    return updated;
  }

  async warnUser(ticketId: string, adminId: string, reason: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { userId: true, subject: true },
    });
    if (!ticket) throw new NotFoundException('Support ticket not found');
    return this.prisma.$transaction(async (transaction) => {
      await transaction.user.update({
        where: { id: ticket.userId },
        data: { supportWarningCount: { increment: 1 } },
      });
      await transaction.notification.create({
        data: {
          userId: ticket.userId,
          type: NotificationType.SYSTEM,
          title: 'Support conduct warning',
          message: reason.trim(),
          data: { ticketId, href: '/dashboard/support' },
        },
      });
      await this.auditService.record(transaction, {
        actorId: adminId,
        actorRole: Role.ADMIN,
        entityType: 'USER',
        entityId: ticket.userId,
        action: 'SUPPORT_WARNING_ISSUED',
        reason: reason.trim(),
        metadata: { ticketId, subject: ticket.subject },
      });
      return { success: true };
    });
  }

  async restrictUser(userId: string, adminId: string, reason: string, durationDays: number) {
    const until = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    return this.prisma.$transaction(async (transaction) => {
      const user = await transaction.user.findUnique({
        where: { id: userId },
        select: { id: true, supportBlockedUntil: true },
      });
      if (!user) throw new NotFoundException('User not found');
      await transaction.user.update({ where: { id: userId }, data: { supportBlockedUntil: until } });
      await transaction.notification.create({
        data: {
          userId,
          type: NotificationType.SYSTEM,
          title: 'Support access temporarily limited',
          message: `${reason.trim()} Support access will be restored on ${until.toLocaleDateString()}.`,
          data: { href: '/dashboard/support' },
        },
      });
      await this.auditService.record(transaction, {
        actorId: adminId,
        actorRole: Role.ADMIN,
        entityType: 'USER',
        entityId: userId,
        action: 'SUPPORT_ACCESS_RESTRICTED',
        previousStatus: user.supportBlockedUntil?.toISOString() ?? null,
        newStatus: until.toISOString(),
        reason: reason.trim(),
        metadata: { durationDays },
      });
      return { success: true, supportBlockedUntil: until };
    });
  }

  async restoreSupport(userId: string, adminId: string, reason: string) {
    return this.prisma.$transaction(async (transaction) => {
      const user = await transaction.user.findUnique({
        where: { id: userId },
        select: { id: true, supportBlockedUntil: true },
      });
      if (!user) throw new NotFoundException('User not found');
      await transaction.user.update({ where: { id: userId }, data: { supportBlockedUntil: null } });
      await transaction.notification.create({
        data: {
          userId,
          type: NotificationType.SYSTEM,
          title: 'Support access restored',
          message: reason.trim(),
          data: { href: '/dashboard/support' },
        },
      });
      await this.auditService.record(transaction, {
        actorId: adminId,
        actorRole: Role.ADMIN,
        entityType: 'USER',
        entityId: userId,
        action: 'SUPPORT_ACCESS_RESTORED',
        previousStatus: user.supportBlockedUntil?.toISOString() ?? null,
        newStatus: 'ACTIVE',
        reason: reason.trim(),
      });
      return { success: true };
    });
  }

  private assertSupportAvailable(blockedUntil: Date | null) {
    if (blockedUntil && blockedUntil > new Date()) {
      throw new ForbiddenException(`Support access is restricted until ${blockedUntil.toISOString()}`);
    }
  }

  private async notifyAdmins(
    transaction: Prisma.TransactionClient,
    notification: { title: string; message: string; ticketId: string },
  ) {
    const admins = await transaction.user.findMany({
      where: { roles: { has: Role.ADMIN } },
      select: { id: true },
    });
    if (!admins.length) return;
    await transaction.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        type: NotificationType.SYSTEM,
        title: notification.title,
        message: notification.message,
        data: { ticketId: notification.ticketId, href: '/admin/support' },
      })),
    });
  }

  private ticketInclude() {
    return {
      user: { select: { id: true, fullName: true, email: true, supportBlockedUntil: true, supportWarningCount: true } },
      messages: {
        orderBy: { createdAt: 'asc' as const },
        include: { sender: { select: { id: true, fullName: true, roles: true } } },
      },
    };
  }
}
