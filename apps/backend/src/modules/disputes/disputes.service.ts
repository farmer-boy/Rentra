import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AgreementStatus,
  DisputeStatus,
  DisputeType,
  Prisma,
  Role,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AssignDisputeDto, ModerateDisputeDto } from './dto/moderate-dispute.dto';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { DisputeQueryDto } from './dto/dispute-query.dto';

const disputeInclude = {
  createdBy: { select: { id: true, fullName: true } },
  assignedAdmin: { select: { id: true, fullName: true } },
  booking: {
    select: {
      id: true,
      status: true,
      tenantId: true,
      listing: { select: { id: true, landlordId: true, title: true } },
      property: { select: { id: true, ownerId: true, title: true } },
    },
  },
  payment: {
    select: {
      id: true,
      status: true,
      amount: true,
      currency: true,
      userId: true,
      booking: {
        select: {
          tenantId: true,
          listing: { select: { landlordId: true } },
          property: { select: { ownerId: true } },
        },
      },
      agreement: {
        select: { tenantId: true, landlordId: true },
      },
    },
  },
  agreement: {
    select: {
      id: true,
      status: true,
      tenantId: true,
      landlordId: true,
      listing: { select: { id: true, title: true } },
      property: { select: { id: true, title: true } },
    },
  },
} satisfies Prisma.DisputeInclude;

const activeDisputeStatuses: DisputeStatus[] = [
  DisputeStatus.OPEN,
  DisputeStatus.MEDIATION,
  DisputeStatus.UNDER_REVIEW,
  DisputeStatus.AWAITING_INFORMATION,
];

const finalDisputeStatuses: DisputeStatus[] = [
  DisputeStatus.RESOLVED,
  DisputeStatus.REJECTED,
  DisputeStatus.CLOSED,
];

type ParticipantContext = {
  participants: Set<string>;
  propertyId?: string | null;
  listingId?: string | null;
};

@Injectable()
export class DisputesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(userId: string, dto: CreateDisputeDto) {
    this.validateTypeReferences(dto);
    const [booking, agreement, payment] = await Promise.all([
      dto.bookingId ? this.getBookingContext(dto.bookingId) : null,
      dto.agreementId ? this.getAgreementContext(dto.agreementId) : null,
      dto.paymentId ? this.getPaymentContext(dto.paymentId) : null,
    ]);
    if (
      (booking && !booking.participants.has(userId)) ||
      (agreement && !agreement.participants.has(userId)) ||
      (payment && !payment.participants.has(userId))
    ) {
      throw new ForbiddenException(
        'You must be a participant in every associated rental or transaction',
      );
    }
    if (booking && agreement && !this.rentalContextsMatch(booking, agreement)) {
      throw new BadRequestException(
        'The booking and agreement do not belong to the same rental',
      );
    }
    if (payment && dto.bookingId && payment.bookingId !== dto.bookingId) {
      throw new BadRequestException(
        'The payment is not associated with the supplied booking',
      );
    }
    if (payment && dto.agreementId && payment.agreementId !== dto.agreementId) {
      throw new BadRequestException(
        'The payment is not associated with the supplied agreement',
      );
    }
    if (payment && booking && payment.bookingId && payment.bookingId !== dto.bookingId) {
      throw new BadRequestException('The payment and booking do not match');
    }
    if (
      payment &&
      agreement &&
      payment.agreementId &&
      payment.agreementId !== dto.agreementId
    ) {
      throw new BadRequestException('The payment and agreement do not match');
    }

    const propertyId =
      booking?.propertyId ??
      agreement?.propertyId ??
      payment?.propertyId ??
      null;
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const refs = [
          dto.bookingId && `booking:${dto.bookingId}`,
          dto.paymentId && `payment:${dto.paymentId}`,
          dto.agreementId && `agreement:${dto.agreementId}`,
          `dispute-rate:${userId}`,
        ].filter((ref): ref is string => Boolean(ref)).sort();
        for (const ref of refs) {
          await transaction.$queryRaw(
            Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${ref}))`,
          );
        }
        const recentCount = await transaction.dispute.count({
          where: {
            createdById: userId,
            createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
          },
        });
        if (recentCount >= 10) {
          throw new HttpException(
            'Dispute submission limit reached. Try again later.',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
        const duplicate = await transaction.dispute.findFirst({
          where: {
            createdById: userId,
            status: { in: activeDisputeStatuses },
            OR: [
              ...(dto.bookingId ? [{ bookingId: dto.bookingId }] : []),
              ...(dto.paymentId ? [{ paymentId: dto.paymentId }] : []),
              ...(dto.agreementId ? [{ agreementId: dto.agreementId }] : []),
            ],
          },
          select: { id: true },
        });
        if (duplicate) {
          throw new ConflictException(
            'You already have an active dispute for this rental or transaction',
          );
        }
        const dispute = await transaction.dispute.create({
          data: {
            createdById: userId,
            type: dto.type,
            title: dto.reason.trim(),
            description: dto.description.trim(),
            bookingId: dto.bookingId,
            paymentId: dto.paymentId,
            agreementId: dto.agreementId,
            propertyId,
          },
          include: disputeInclude,
        });
        await this.audit.record(transaction, {
          actorId: userId,
          actorRole: 'USER',
          entityType: 'DISPUTE',
          entityId: dispute.id,
          action: 'DISPUTE_CREATED',
          newStatus: DisputeStatus.OPEN,
          reason: dto.reason.trim(),
          metadata: {
            type: dto.type,
            bookingId: dto.bookingId ?? null,
            paymentId: dto.paymentId ?? null,
            agreementId: dto.agreementId ?? null,
          },
        });
        return dispute;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'You already have an active dispute for this rental or transaction',
        );
      }
      throw error;
    }
  }

  async getMine(userId: string, query: DisputeQueryDto) {
    const where: Prisma.DisputeWhereInput = {
      OR: [{ createdById: userId }, { assignedAdminId: userId }],
      ...(query.status && { status: query.status }),
      ...(query.type && { type: query.type }),
    };
    return this.paginate(where, query);
  }

  async getById(id: string, userId: string, isAdmin: boolean) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      include: disputeInclude,
    });
    if (!dispute) throw new NotFoundException('Dispute not found');
    const hasAccess =
      isAdmin ||
      dispute.createdById === userId ||
      dispute.booking?.tenantId === userId ||
      dispute.booking?.listing?.landlordId === userId ||
      dispute.booking?.property?.ownerId === userId ||
      dispute.agreement?.tenantId === userId ||
      dispute.agreement?.landlordId === userId ||
      dispute.payment?.userId === userId ||
      dispute.payment?.booking?.tenantId === userId ||
      dispute.payment?.booking?.listing?.landlordId === userId ||
      dispute.payment?.booking?.property?.ownerId === userId ||
      dispute.payment?.agreement?.tenantId === userId ||
      dispute.payment?.agreement?.landlordId === userId;
    if (!hasAccess) {
      throw new ForbiddenException('You cannot access this dispute');
    }
    return {
      ...dispute,
      auditHistory: await this.audit.listForEntity('DISPUTE', id, isAdmin),
    };
  }

  async listForAdmin(query: DisputeQueryDto) {
    return this.paginate(
      {
        ...(query.status && { status: query.status }),
        ...(query.type && { type: query.type }),
      },
      query,
    );
  }

  async assign(id: string, actorId: string, adminId: string) {
    await this.assertAdmin(adminId);
    return this.prisma.$transaction(async (transaction) => {
      const current = await transaction.dispute.findUnique({ where: { id } });
      if (!current) throw new NotFoundException('Dispute not found');
      if (current.assignedAdminId === adminId) {
        throw new ConflictException('Dispute is already assigned to this admin');
      }
      const changed = await transaction.dispute.updateMany({
        where: { id, updatedAt: current.updatedAt },
        data: { assignedAdminId: adminId },
      });
      if (changed.count !== 1) {
        throw new ConflictException('Dispute changed; reload and retry');
      }
      await this.audit.record(transaction, {
        actorId,
        actorRole: 'ADMIN',
        entityType: 'DISPUTE',
        entityId: id,
        action: current.assignedAdminId
          ? 'DISPUTE_REASSIGNED'
          : 'DISPUTE_ASSIGNED',
        metadata: {
          previousAdminId: current.assignedAdminId,
          assignedAdminId: adminId,
        },
      });
      return transaction.dispute.findUniqueOrThrow({
        where: { id },
        include: disputeInclude,
      });
    });
  }

  async recordInvestigationNote(
    id: string,
    actorId: string,
    note: string,
    requestInformation = false,
  ) {
    const cleanedNote = note.trim();
    if (!cleanedNote) {
      throw new BadRequestException('An investigation note is required');
    }
    return this.prisma.$transaction(async (transaction) => {
      const current = await transaction.dispute.findUnique({ where: { id } });
      if (!current) throw new NotFoundException('Dispute not found');
      if (finalDisputeStatuses.includes(current.status)) {
        throw new ConflictException(
          'A final dispute cannot receive investigation notes',
        );
      }
      const nextStatus = requestInformation
        ? DisputeStatus.AWAITING_INFORMATION
        : DisputeStatus.UNDER_REVIEW;
      if (current.status !== nextStatus) {
        const changed = await transaction.dispute.updateMany({
          where: { id, status: current.status, updatedAt: current.updatedAt },
          data: { status: nextStatus },
        });
        if (changed.count !== 1) {
          throw new ConflictException('Dispute changed; reload and retry');
        }
      }
      await this.audit.record(transaction, {
        actorId,
        actorRole: 'ADMIN',
        entityType: 'DISPUTE',
        entityId: id,
        action: requestInformation
          ? 'INFORMATION_REQUESTED'
          : 'INVESTIGATION_NOTE_RECORDED',
        previousStatus: current.status,
        newStatus: nextStatus,
        reason: cleanedNote,
      });
      return transaction.dispute.findUniqueOrThrow({
        where: { id },
        include: disputeInclude,
      });
    });
  }

  async moderate(id: string, actorId: string, dto: ModerateDisputeDto) {
    if (
      finalDisputeStatuses.includes(dto.status) &&
      !dto.resolutionNote?.trim()
    ) {
      throw new BadRequestException(
        'A resolutionNote is required for a final dispute status',
      );
    }
    const dispute = await this.prisma.$transaction(async (transaction) => {
      const current = await transaction.dispute.findUnique({ where: { id } });
      if (!current) throw new NotFoundException('Dispute not found');
      if (
        finalDisputeStatuses.includes(current.status) &&
        current.status !== dto.status &&
        current.status !== DisputeStatus.RESOLVED
      ) {
        throw new ConflictException(
          'Rejected or closed disputes cannot be reopened',
        );
      }
      if (current.status === dto.status) {
        throw new ConflictException('Dispute already has this status');
      }
      const changed = await transaction.dispute.updateMany({
        where: {
          id,
          status: current.status,
          updatedAt: current.updatedAt,
        },
        data: {
          status: dto.status,
          resolutionNote:
            dto.resolutionNote?.trim() ?? current.resolutionNote,
          resolution: dto.resolutionNote?.trim() ?? current.resolution,
          resolvedAt: finalDisputeStatuses.includes(dto.status)
            ? new Date()
            : null,
        },
      });
      if (changed.count !== 1) {
        throw new ConflictException('Dispute changed; reload and retry');
      }
      await this.audit.record(transaction, {
        actorId,
        actorRole: 'ADMIN',
        entityType: 'DISPUTE',
        entityId: id,
        action:
          dto.status === DisputeStatus.RESOLVED
            ? 'DISPUTE_RESOLVED'
            : dto.status === DisputeStatus.REJECTED
              ? 'DISPUTE_REJECTED'
              : 'DISPUTE_STATUS_CHANGED',
        previousStatus: current.status,
        newStatus: dto.status,
        reason: dto.resolutionNote?.trim() ?? null,
      });
      const dispute = await transaction.dispute.findUniqueOrThrow({
        where: { id },
        include: disputeInclude,
      });
      return dispute;
    });
    return {
      ...dispute,
      auditHistory: await this.audit.listForEntity('DISPUTE', id, true),
    };
  }

  async resolve(id: string, actorId: string, resolutionNote: string) {
    return this.moderate(id, actorId, {
      status: DisputeStatus.RESOLVED,
      resolutionNote,
    });
  }

  async close(id: string, actorId: string, resolutionNote: string) {
    return this.moderate(id, actorId, {
      status: DisputeStatus.CLOSED,
      resolutionNote,
    });
  }

  private validateTypeReferences(dto: CreateDisputeDto) {
    const references = [
      dto.bookingId,
      dto.paymentId,
      dto.agreementId,
    ].filter(Boolean).length;
    if (references === 0) {
      throw new BadRequestException(
        'A booking, payment, or agreement reference is required',
      );
    }
    if (dto.type === DisputeType.BOOKING && !dto.bookingId) {
      throw new BadRequestException('BOOKING disputes require bookingId');
    }
    if (dto.type === DisputeType.PAYMENT && !dto.paymentId) {
      throw new BadRequestException('PAYMENT disputes require paymentId');
    }
    if (dto.type === DisputeType.AGREEMENT && !dto.agreementId) {
      throw new BadRequestException('AGREEMENT disputes require agreementId');
    }
  }

  private async getBookingContext(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        tenantId: true,
        listingId: true,
        propertyId: true,
        listing: { select: { landlordId: true } },
        property: { select: { ownerId: true } },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return {
      bookingId: booking.id,
      listingId: booking.listingId,
      propertyId: booking.propertyId,
      participants: new Set(
        [
          booking.tenantId,
          booking.listing?.landlordId,
          booking.property?.ownerId,
        ].filter((id): id is string => Boolean(id)),
      ),
    };
  }

  private async getAgreementContext(id: string) {
    const agreement = await this.prisma.agreement.findUnique({
      where: { id },
      select: {
        id: true,
        tenantId: true,
        landlordId: true,
        listingId: true,
        propertyId: true,
        status: true,
      },
    });
    if (!agreement) throw new NotFoundException('Agreement not found');
    if (agreement.status === AgreementStatus.DRAFT) {
      throw new BadRequestException('A draft agreement cannot be disputed');
    }
    return {
      agreementId: agreement.id,
      listingId: agreement.listingId,
      propertyId: agreement.propertyId,
      participants: new Set([agreement.tenantId, agreement.landlordId]),
    };
  }

  private async getPaymentContext(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        bookingId: true,
        agreementId: true,
        booking: {
          select: {
            tenantId: true,
            listingId: true,
            propertyId: true,
            listing: { select: { landlordId: true } },
            property: { select: { ownerId: true } },
          },
        },
        agreement: {
          select: { tenantId: true, landlordId: true, listingId: true, propertyId: true },
        },
        rentalRequest: {
          select: { tenantId: true, landlordId: true, listingId: true, propertyId: true },
        },
      },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return {
      paymentId: payment.id,
      bookingId: payment.bookingId,
      agreementId: payment.agreementId,
      listingId:
        payment.booking?.listingId ??
        payment.agreement?.listingId ??
        payment.rentalRequest?.listingId,
      propertyId:
        payment.booking?.propertyId ??
        payment.agreement?.propertyId ??
        payment.rentalRequest?.propertyId,
      participants: new Set(
        [
          payment.userId,
          payment.booking?.tenantId,
          payment.booking?.listing?.landlordId,
          payment.booking?.property?.ownerId,
          payment.agreement?.tenantId,
          payment.agreement?.landlordId,
          payment.rentalRequest?.tenantId,
          payment.rentalRequest?.landlordId,
        ].filter((id): id is string => Boolean(id)),
      ),
    };
  }

  private rentalContextsMatch(
    booking: ParticipantContext & { listingId?: string | null },
    agreement: ParticipantContext & { listingId?: string | null },
  ) {
    return (
      (booking.listingId !== null &&
        booking.listingId === agreement.listingId) ||
      (booking.propertyId !== null &&
        booking.propertyId === agreement.propertyId)
    );
  }

  private async assertAdmin(adminId: string) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
      select: { roles: true, isSuspended: true },
    });
    if (!admin || admin.isSuspended || !admin.roles.includes(Role.ADMIN)) {
      throw new ForbiddenException('Assigned account must be an active admin');
    }
  }

  private async paginate(
    where: Prisma.DisputeWhereInput,
    query: DisputeQueryDto,
  ) {
    const skip = (query.page - 1) * query.limit;
    const [data, totalCount] = await this.prisma.$transaction([
      this.prisma.dispute.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
        include: disputeInclude,
      }),
      this.prisma.dispute.count({ where }),
    ]);
    return {
      data,
      totalCount,
      pagination: {
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(totalCount / query.limit),
      },
    };
  }
}
