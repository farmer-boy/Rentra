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
  ListingPublicationStatus,
  ListingStatus,
  Prisma,
  ReportStatus,
  ReportTargetType,
  Role,
  TrustSource,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { TrustScoreService } from '../trust-score/trust-score.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ModerateReportDto, ResolveReportDto } from './dto/moderate-report.dto';
import { ReportQueryDto } from './dto/report-query.dto';

const reportInclude = {
  reporter: { select: { id: true, fullName: true } },
  assignedAdmin: { select: { id: true, fullName: true } },
} satisfies Prisma.ReportInclude;

const activeReportStatuses: ReportStatus[] = [
  ReportStatus.OPEN,
  ReportStatus.INVESTIGATING,
];

const terminalReportStatuses: ReportStatus[] = [
  ReportStatus.RESOLVED,
  ReportStatus.REJECTED,
];

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly trustScore: TrustScoreService,
  ) {}

  async create(reporterId: string, dto: CreateReportDto) {
    const targetFields = await this.validateTarget(dto);
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const lockKeys = [
          `report-target:${reporterId}:${dto.targetType}:${dto.targetId}`,
          `report-rate:${reporterId}`,
        ].sort();
        for (const lockKey of lockKeys) {
          await transaction.$queryRaw(
            Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`,
          );
        }
        const recentCount = await transaction.report.count({
          where: {
            reporterId,
            createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
          },
        });
        if (recentCount >= 20) {
          throw new HttpException(
            'Report submission limit reached. Try again later.',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
        const duplicate = await transaction.report.findFirst({
          where: {
            reporterId,
            targetType: dto.targetType,
            targetId: dto.targetId,
            status: { in: activeReportStatuses },
          },
          select: { id: true },
        });
        if (duplicate) {
          throw new ConflictException(
            'You already have an active report for this target',
          );
        }
        const report = await transaction.report.create({
          data: {
            reporterId,
            targetType: dto.targetType,
            targetId: dto.targetId,
            reason: dto.reason,
            description: dto.description?.trim() || null,
            ...targetFields,
          },
          include: reportInclude,
        });
        await this.audit.record(transaction, {
          actorId: reporterId,
          actorRole: 'USER',
          entityType: 'REPORT',
          entityId: report.id,
          action: 'REPORT_CREATED',
          newStatus: ReportStatus.OPEN,
          reason: dto.reason,
          metadata: { targetType: dto.targetType, targetId: dto.targetId },
        });
        return report;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'You already have an active report for this target',
        );
      }
      throw error;
    }
  }

  async getMine(reporterId: string, query: ReportQueryDto) {
    return this.paginate(
      {
        reporterId,
        ...(query.status && { status: query.status }),
        ...(query.targetType && { targetType: query.targetType }),
      },
      query,
    );
  }

  async getById(id: string, userId: string, isAdmin: boolean) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: reportInclude,
    });
    if (!report) throw new NotFoundException('Report not found');
    if (!isAdmin && report.reporterId !== userId) {
      throw new ForbiddenException('You cannot access this report');
    }
    const auditHistory = await this.audit.listForEntity(
      'REPORT',
      id,
      isAdmin,
    );
    if (!isAdmin) return { ...report, auditHistory };
    return {
      ...report,
      target: await this.getAdminTargetDetails(report),
      auditHistory,
    };
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
      const current = await transaction.report.findUnique({ where: { id } });
      if (!current) throw new NotFoundException('Report not found');
      if (terminalReportStatuses.includes(current.status)) {
        throw new ConflictException(
          'A final report cannot receive investigation notes',
        );
      }
      const nextStatus = ReportStatus.INVESTIGATING;
      if (current.status !== nextStatus) {
        const changed = await transaction.report.updateMany({
          where: { id, status: current.status, updatedAt: current.updatedAt },
          data: { status: nextStatus },
        });
        if (changed.count !== 1) {
          throw new ConflictException('Report changed; reload and retry');
        }
      }
      await this.audit.record(transaction, {
        actorId,
        actorRole: 'ADMIN',
        entityType: 'REPORT',
        entityId: id,
        action: requestInformation
          ? 'INFORMATION_REQUESTED'
          : 'INVESTIGATION_NOTE_RECORDED',
        previousStatus: current.status,
        newStatus: nextStatus,
        reason: cleanedNote,
      });
      return transaction.report.findUniqueOrThrow({
        where: { id },
        include: reportInclude,
      });
    });
  }

  async listForAdmin(query: ReportQueryDto) {
    return this.paginate(
      {
        ...(query.status && { status: query.status }),
        ...(query.targetType && { targetType: query.targetType }),
      },
      query,
    );
  }

  async assign(id: string, actorId: string, adminId: string) {
    await this.assertAdmin(adminId);
    return this.prisma.$transaction(async (transaction) => {
      const current = await transaction.report.findUnique({ where: { id } });
      if (!current) throw new NotFoundException('Report not found');
      if (current.assignedAdminId === adminId) {
        throw new ConflictException('Report is already assigned to this admin');
      }
      const changed = await transaction.report.updateMany({
        where: { id, updatedAt: current.updatedAt },
        data: { assignedAdminId: adminId },
      });
      if (changed.count !== 1) {
        throw new ConflictException('Report changed; reload and retry');
      }
      await this.audit.record(transaction, {
        actorId,
        actorRole: 'ADMIN',
        entityType: 'REPORT',
        entityId: id,
        action: current.assignedAdminId ? 'REPORT_REASSIGNED' : 'REPORT_ASSIGNED',
        metadata: {
          previousAdminId: current.assignedAdminId,
          assignedAdminId: adminId,
        },
      });
      return transaction.report.findUniqueOrThrow({
        where: { id },
        include: reportInclude,
      });
    });
  }

  async moderate(id: string, actorId: string, dto: ModerateReportDto) {
    const result = await this.updateModeration(id, actorId, dto);
    if (
      result.targetType === ReportTargetType.USER &&
      (result.previousViolationConfirmed !== result.violationConfirmed ||
        (result.previousStatus !== dto.status &&
          (result.previousViolationConfirmed || result.violationConfirmed)))
    ) {
      await this.trustScore.recalculateForUser(
        result.targetId,
        TrustSource.REPORT,
        'Recalculated after a confirmed report finding changed',
      );
    }
    const report = await this.prisma.report.findUniqueOrThrow({
      where: { id },
      include: reportInclude,
    });
    return {
      ...report,
      auditHistory: await this.audit.listForEntity('REPORT', id),
    };
  }

  resolve(
    id: string,
    actorId: string,
    dto: ResolveReportDto,
  ) {
    return this.moderate(id, actorId, {
      status: ReportStatus.RESOLVED,
      resolutionNote: dto.resolutionNote,
      violationConfirmed: dto.violationConfirmed ?? false,
    });
  }

  async suspendReportedUser(
    reportId: string,
    actorId: string,
    reason: string,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const report = await transaction.report.findUnique({
        where: { id: reportId },
      });
      if (!report) throw new NotFoundException('Report not found');
      if (
        report.targetType !== ReportTargetType.USER ||
        report.status !== ReportStatus.RESOLVED ||
        !report.violationConfirmed
      ) {
        throw new ForbiddenException(
          'Only a resolved report with a confirmed finding can suspend its reported user',
        );
      }
      const user = await transaction.user.findUnique({
        where: { id: report.targetId },
        select: { id: true, isSuspended: true },
      });
      if (!user) throw new NotFoundException('Reported user not found');
      if (user.isSuspended) {
        throw new ConflictException('User is already suspended');
      }
      await transaction.user.update({
        where: { id: user.id },
        data: { isSuspended: true },
      });
      await this.audit.record(transaction, {
        actorId,
        actorRole: 'ADMIN',
        entityType: 'USER',
        entityId: user.id,
        action: 'USER_SUSPENDED',
        reason,
        metadata: { reportId },
      });
      await this.audit.record(transaction, {
        actorId,
        actorRole: 'ADMIN',
        entityType: 'REPORT',
        entityId: report.id,
        action: 'REPORTED_USER_SUSPENDED',
        reason,
        metadata: { userId: user.id },
      });
      return { userId: user.id, isSuspended: true };
    });
  }

  async removeReportedListing(
    reportId: string,
    actorId: string,
    reason: string,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const report = await transaction.report.findUnique({
        where: { id: reportId },
      });
      if (!report) throw new NotFoundException('Report not found');
      if (
        (report.targetType !== ReportTargetType.LISTING &&
          report.targetType !== ReportTargetType.PROPERTY) ||
        report.status !== ReportStatus.RESOLVED ||
        !report.violationConfirmed
      ) {
        throw new ForbiddenException(
          'Only a resolved report with a confirmed listing violation can remove a listing',
        );
      }
      const listings = await transaction.listing.findMany({
        where:
          report.targetType === ReportTargetType.LISTING
            ? { id: report.targetId }
            : { propertyId: report.targetId },
        select: { id: true, status: true, publicationStatus: true },
      });
      if (listings.length === 0) {
        throw new NotFoundException('No active listing was found for this report');
      }
      for (const listing of listings) {
        if (
          listing.status === ListingStatus.UNPUBLISHED &&
          listing.publicationStatus === ListingPublicationStatus.UNPUBLISHED
        ) {
          continue;
        }
        await transaction.listing.update({
          where: { id: listing.id },
          data: {
            status: ListingStatus.UNPUBLISHED,
            publicationStatus: ListingPublicationStatus.UNPUBLISHED,
          },
        });
        await this.audit.record(transaction, {
          actorId,
          actorRole: 'ADMIN',
          entityType: 'LISTING',
          entityId: listing.id,
          action: 'LISTING_REMOVED',
          reason,
          metadata: {
            reportId,
            previousStatus: listing.status,
            previousPublicationStatus: listing.publicationStatus,
          },
        });
      }
      await this.audit.record(transaction, {
        actorId,
        actorRole: 'ADMIN',
        entityType: 'REPORT',
        entityId: report.id,
        action: 'REPORTED_LISTING_REMOVED',
        reason,
        metadata: { listingIds: listings.map(({ id }) => id) },
      });
      return { listingIds: listings.map(({ id }) => id), removed: true };
    });
  }

  async restoreReportedListing(
    reportId: string,
    actorId: string,
    reason: string,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const report = await transaction.report.findUnique({
        where: { id: reportId },
      });
      if (!report) throw new NotFoundException('Report not found');
      if (
        (report.targetType !== ReportTargetType.LISTING &&
          report.targetType !== ReportTargetType.PROPERTY)
      ) {
        throw new BadRequestException(
          'This report does not concern a listing or property',
        );
      }
      const listings = await transaction.listing.findMany({
        where:
          report.targetType === ReportTargetType.LISTING
            ? { id: report.targetId }
            : { propertyId: report.targetId },
        select: { id: true, status: true, publicationStatus: true },
      });
      const restored: string[] = [];
      for (const listing of listings) {
        const removalEvent = await transaction.moderationAuditEvent.findFirst({
          where: {
            entityType: 'LISTING',
            entityId: listing.id,
            action: 'LISTING_REMOVED',
          },
          orderBy: { createdAt: 'desc' },
          select: { metadata: true },
        });
        const metadata = removalEvent?.metadata;
        if (
          !metadata ||
          typeof metadata !== 'object' ||
          Array.isArray(metadata) ||
          metadata.reportId !== reportId
        ) {
          continue;
        }
        const previousStatus = metadata.previousStatus;
        const previousPublicationStatus = metadata.previousPublicationStatus;
        if (
          typeof previousStatus !== 'string' ||
          !Object.values(ListingStatus).includes(previousStatus as ListingStatus) ||
          typeof previousPublicationStatus !== 'string' ||
          !Object.values(ListingPublicationStatus).includes(
            previousPublicationStatus as ListingPublicationStatus,
          )
        ) {
          throw new ConflictException(
            'The original listing status is unavailable for safe restoration',
          );
        }
        await transaction.listing.update({
          where: { id: listing.id },
          data: {
            status: previousStatus as ListingStatus,
            publicationStatus:
              previousPublicationStatus as ListingPublicationStatus,
          },
        });
        await this.audit.record(transaction, {
          actorId,
          actorRole: 'ADMIN',
          entityType: 'LISTING',
          entityId: listing.id,
          action: 'LISTING_RESTORED',
          reason,
          metadata: { reportId },
        });
        restored.push(listing.id);
      }
      if (restored.length === 0) {
        throw new ConflictException(
          'No listing removed by this report can be restored',
        );
      }
      await this.audit.record(transaction, {
        actorId,
        actorRole: 'ADMIN',
        entityType: 'REPORT',
        entityId: report.id,
        action: 'REPORTED_LISTING_RESTORED',
        reason,
        metadata: { listingIds: restored },
      });
      return { listingIds: restored, restored: true };
    });
  }

  async reinstateReportedUser(
    reportId: string,
    actorId: string,
    reason: string,
  ) {
    const result = await this.prisma.$transaction(async (transaction) => {
      const report = await transaction.report.findUnique({
        where: { id: reportId },
      });
      if (!report) throw new NotFoundException('Report not found');
      if (report.targetType !== ReportTargetType.USER) {
        throw new BadRequestException('This report does not target a user');
      }
      const user = await transaction.user.findUnique({
        where: { id: report.targetId },
        select: { id: true, isSuspended: true },
      });
      if (!user) throw new NotFoundException('Reported user not found');
      if (!user.isSuspended && !report.violationConfirmed) {
        throw new ConflictException(
          'The user is already active and the finding is not confirmed',
        );
      }
      await transaction.user.update({
        where: { id: user.id },
        data: { isSuspended: false },
      });
      const previousStatus = report.status;
      await transaction.report.update({
        where: { id: report.id },
        data: {
          status: ReportStatus.INVESTIGATING,
          violationConfirmed: false,
          resolvedAt: null,
        },
      });
      await this.audit.record(transaction, {
        actorId,
        actorRole: 'ADMIN',
        entityType: 'USER',
        entityId: user.id,
        action: 'USER_REINSTATED',
        reason,
        metadata: { reportId },
      });
      await this.audit.record(transaction, {
        actorId,
        actorRole: 'ADMIN',
        entityType: 'REPORT',
        entityId: report.id,
        action: 'REPORT_FINDING_REVERSED',
        previousStatus,
        newStatus: ReportStatus.INVESTIGATING,
        reason,
        metadata: {
          previousViolationConfirmed: report.violationConfirmed,
          violationConfirmed: false,
        },
      });
      return {
        userId: user.id,
        shouldRecalculate:
          report.violationConfirmed ||
          previousStatus === ReportStatus.RESOLVED,
      };
    });
    if (result.shouldRecalculate) {
      await this.trustScore.recalculateForUser(
        result.userId,
        TrustSource.REPORT,
        'Recalculated after a confirmed report finding was reversed',
      );
    }
    return { userId: result.userId, isSuspended: false };
  }

  private async updateModeration(
    id: string,
    actorId: string,
    dto: ModerateReportDto,
  ) {
    if (
      terminalReportStatuses.includes(dto.status) &&
      !dto.resolutionNote?.trim()
    ) {
      throw new BadRequestException(
        'A resolutionNote is required for a resolved or rejected report',
      );
    }
    if (dto.violationConfirmed && dto.status !== ReportStatus.RESOLVED) {
      throw new BadRequestException(
        'A violation can only be confirmed when resolving a report',
      );
    }

    return this.prisma.$transaction(async (transaction) => {
      const current = await transaction.report.findUnique({ where: { id } });
      if (!current) throw new NotFoundException('Report not found');
      if (
        terminalReportStatuses.includes(current.status) &&
        current.status !== dto.status &&
        current.status !== ReportStatus.RESOLVED
      ) {
        throw new ConflictException('Rejected reports cannot be reopened');
      }
      if (current.status === dto.status) {
        throw new ConflictException('Report already has this status');
      }
      const nextViolation = dto.status === ReportStatus.RESOLVED
        ? (dto.violationConfirmed ?? false)
        : false;
      const changed = await transaction.report.updateMany({
        where: { id, status: current.status, updatedAt: current.updatedAt },
        data: {
          status: dto.status,
          resolutionNote: dto.resolutionNote?.trim() ?? current.resolutionNote,
          resolvedAt: terminalReportStatuses.includes(dto.status)
            ? new Date()
            : null,
          violationConfirmed: nextViolation,
        },
      });
      if (changed.count !== 1) {
        throw new ConflictException('Report changed; reload and retry');
      }
      await this.audit.record(transaction, {
        actorId,
        actorRole: 'ADMIN',
        entityType: 'REPORT',
        entityId: id,
        action:
          dto.status === ReportStatus.RESOLVED
            ? 'REPORT_RESOLVED'
            : dto.status === ReportStatus.REJECTED
              ? 'REPORT_REJECTED'
              : 'REPORT_STATUS_CHANGED',
        previousStatus: current.status,
        newStatus: dto.status,
        reason: dto.resolutionNote?.trim() ?? null,
        metadata: { violationConfirmed: nextViolation },
      });
      return {
        targetType: current.targetType,
        targetId: current.targetId,
        previousStatus: current.status,
        previousViolationConfirmed: current.violationConfirmed,
        violationConfirmed: nextViolation,
      };
    });
  }

  private async validateTarget(dto: CreateReportDto) {
    switch (dto.targetType) {
      case ReportTargetType.PROPERTY: {
        const property = await this.prisma.property.findUnique({
          where: { id: dto.targetId },
          select: { id: true },
        });
        if (!property) throw new NotFoundException('Property not found');
        return { propertyId: property.id };
      }
      case ReportTargetType.LISTING: {
        const listing = await this.prisma.listing.findUnique({
          where: { id: dto.targetId },
          select: { id: true },
        });
        if (!listing) throw new NotFoundException('Listing not found');
        return { listingId: listing.id };
      }
      case ReportTargetType.USER: {
        const user = await this.prisma.user.findUnique({
          where: { id: dto.targetId },
          select: { id: true },
        });
        if (!user) throw new NotFoundException('User not found');
        return {};
      }
      case ReportTargetType.BOOKING: {
        const booking = await this.prisma.booking.findUnique({
          where: { id: dto.targetId },
          select: { id: true },
        });
        if (!booking) throw new NotFoundException('Booking not found');
        return {};
      }
      case ReportTargetType.REVIEW: {
        const review = await this.prisma.review.findUnique({
          where: { id: dto.targetId },
          select: { id: true },
        });
        if (!review) throw new NotFoundException('Review not found');
        return {};
      }
      case ReportTargetType.MESSAGE: {
        const message = await this.prisma.message.findUnique({
          where: { id: dto.targetId },
          select: { id: true },
        });
        if (!message) throw new NotFoundException('Message not found');
        return { messageId: message.id };
      }
    }
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

  private async getAdminTargetDetails(report: {
    targetType: ReportTargetType;
    targetId: string;
  }) {
    switch (report.targetType) {
      case ReportTargetType.PROPERTY:
        return this.prisma.property.findUnique({
          where: { id: report.targetId },
          select: {
            id: true,
            title: true,
            city: true,
            area: true,
            status: true,
            owner: { select: { id: true, fullName: true } },
          },
        });
      case ReportTargetType.LISTING:
        return this.prisma.listing.findUnique({
          where: { id: report.targetId },
          select: {
            id: true,
            title: true,
            city: true,
            area: true,
            status: true,
            publicationStatus: true,
            landlord: { select: { id: true, fullName: true } },
          },
        });
      case ReportTargetType.BOOKING:
        return this.prisma.booking.findUnique({
          where: { id: report.targetId },
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            tenant: { select: { id: true, fullName: true } },
            listing: { select: { id: true, title: true } },
          },
        });
      case ReportTargetType.USER:
        return this.prisma.user.findUnique({
          where: { id: report.targetId },
          select: {
            id: true,
            fullName: true,
            roles: true,
            isVerified: true,
            isSuspended: true,
          },
        });
      case ReportTargetType.REVIEW:
        return this.prisma.review.findUnique({
          where: { id: report.targetId },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            user: { select: { id: true, fullName: true } },
            listing: { select: { id: true, title: true } },
          },
        });
      case ReportTargetType.MESSAGE:
        return this.prisma.message.findUnique({
          where: { id: report.targetId },
          select: {
            id: true,
            content: true,
            createdAt: true,
            sender: { select: { id: true, fullName: true } },
          },
        });
    }
  }

  private async paginate(
    where: Prisma.ReportWhereInput,
    query: ReportQueryDto,
  ) {
    const skip = (query.page - 1) * query.limit;
    const [data, totalCount] = await this.prisma.$transaction([
      this.prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
        include: reportInclude,
      }),
      this.prisma.report.count({ where }),
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
