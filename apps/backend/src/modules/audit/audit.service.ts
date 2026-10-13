import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

export type AuditEventInput = {
  actorId?: string | null;
  actorRole?: string | null;
  entityType: 'REPORT' | 'DISPUTE' | 'USER' | 'LISTING' | 'PROPERTY';
  entityId: string;
  action: string;
  previousStatus?: string | null;
  newStatus?: string | null;
  reason?: string | null;
  metadata?: Prisma.InputJsonValue;
};

type AuditTransaction = Prisma.TransactionClient | PrismaService;

@Injectable()
export class AuditService {
  async record(transaction: AuditTransaction, event: AuditEventInput) {
    return transaction.moderationAuditEvent.create({
      data: {
        actorId: event.actorId ?? null,
        actorRole: event.actorRole ?? null,
        entityType: event.entityType,
        entityId: event.entityId,
        action: event.action,
        previousStatus: event.previousStatus ?? null,
        newStatus: event.newStatus ?? null,
        reason: event.reason ?? null,
        ...(event.metadata !== undefined && { metadata: event.metadata }),
      },
    });
  }

  listForEntity(
    entityType: AuditEventInput['entityType'],
    entityId: string,
    includeInternal = false,
  ) {
    return this.client.moderationAuditEvent.findMany({
      where: {
        entityType,
        entityId,
        ...(!includeInternal && {
          action: {
            notIn: ['INVESTIGATION_NOTE_RECORDED', 'INFORMATION_REQUESTED'],
          },
        }),
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        actorId: true,
        actorRole: true,
        action: true,
        previousStatus: true,
        newStatus: true,
        reason: true,
        metadata: true,
        createdAt: true,
      },
    });
  }

  constructor(private readonly client: PrismaService) {}
}
