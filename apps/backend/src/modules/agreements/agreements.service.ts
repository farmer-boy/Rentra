import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AgreementAmendmentStatus, AgreementTerminationRequestStatus, AgreementTerminationResponseDecision, AgreementStatus, NotificationType, Prisma, Role, TrustSource } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TrustScoreService } from '../trust-score/trust-score.service';
import { TerminateAgreementDto } from './dto/terminate-agreement.dto';
import { CreateAgreementAmendmentDto } from './dto/create-agreement-amendment.dto';
import { RespondAgreementAmendmentDto } from './dto/respond-agreement-amendment.dto';
import { RespondTerminationRequestDto } from './dto/respond-termination-request.dto';
import { RespondTerminationOutcomeDto } from './dto/respond-termination-outcome.dto';
import { CreateTerminationReviewDto } from './dto/create-termination-review.dto';

@Injectable()
export class AgreementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trustScoreService: TrustScoreService,
  ) {}

  async myAgreements(userId: string) {
    await this.expireElapsedAgreements(userId);
    const agreements = await this.prisma.agreement.findMany({
      where: { OR: [{ tenantId: userId }, { landlordId: userId }] },
      orderBy: { createdAt: 'desc' },
      include: this.agreementInclude(userId),
    });
    return Promise.all(agreements.map((agreement) => this.withDisputeEligibility(agreement)));
  }

  async findById(id: string, userId: string) {
    await this.expireElapsedAgreements(userId, id);
    const agreement = await this.prisma.agreement.findUnique({
      where: { id },
      include: this.agreementInclude(userId),
    });
    if (!agreement) throw new NotFoundException('Agreement not found');
    this.assertParticipant(agreement.tenantId, agreement.landlordId, userId);
    return this.withDisputeEligibility(agreement);
  }

  async markPageOpen(id: string, userId: string) {
    const agreement = await this.prisma.agreement.findUnique({ where: { id }, select: { id: true, tenantId: true, landlordId: true } });
    if (!agreement) throw new NotFoundException('Agreement not found');
    this.assertParticipant(agreement.tenantId, agreement.landlordId, userId);
    return this.prisma.agreementPresence.upsert({
      where: { agreementId_userId: { agreementId: id, userId } },
      create: { agreementId: id, userId, seenAt: new Date() },
      update: { seenAt: new Date() },
      select: { agreementId: true, seenAt: true },
    });
  }

  async createTerminationReview(id: string, requestId: string, userId: string, dto: CreateTerminationReviewDto) {
    const agreement = await this.prisma.agreement.findUnique({
      where: { id },
      select: { id: true, tenantId: true, landlordId: true, status: true },
    });
    if (!agreement) throw new NotFoundException('Agreement not found');
    this.assertParticipant(agreement.tenantId, agreement.landlordId, userId);
    if (agreement.status !== AgreementStatus.TERMINATED) {
      throw new BadRequestException('Reviews are available only after both parties approve cancellation');
    }
    const request = await this.prisma.agreementTerminationRequest.findFirst({
      where: { id: requestId, agreementId: id, status: AgreementTerminationRequestStatus.APPROVED },
      select: { id: true },
    });
    if (!request) throw new BadRequestException('This cancellation was not approved by both parties');
    const targetUserId = userId === agreement.tenantId ? agreement.landlordId : agreement.tenantId;
    try {
      const review = await this.prisma.$transaction(async (transaction) => {
        const review = await transaction.agreementTerminationReview.create({
          data: { agreementId: id, terminationRequestId: requestId, reviewerId: userId, targetUserId, rating: dto.rating, comment: dto.comment.trim() },
        });
        await this.notifyUnlessViewing(transaction, id, targetUserId, {
          type: NotificationType.NEW_REVIEW,
          title: 'Agreement cancellation review received',
          message: `The other party left you a ${dto.rating}-star review: ${dto.comment.trim()}`,
          data: { agreementId: id, terminationRequestId: requestId, href: userId === agreement.tenantId ? '/dashboard/property-agreements' : '/dashboard/my-agreements' },
        });
        return review;
      });
      await this.trustScoreService.recalculateForUser(
        targetUserId,
        TrustSource.REVIEW,
        'Received an agreement completion review',
      );
      return review;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('You have already reviewed the other party for this cancellation');
      }
      throw error;
    }
  }

  async terminate(id: string, userId: string, dto: TerminateAgreementDto) {
    const reason = dto.reason?.trim();
    if (!reason) {
      throw new BadRequestException('A reason is required to cancel an agreement');
    }

    const agreement = await this.prisma.agreement.findUnique({
      where: { id },
      select: {
        id: true,
        tenantId: true,
        landlordId: true,
        status: true,
        endDate: true,
      },
    });
    if (!agreement) throw new NotFoundException('Agreement not found');
    this.assertParticipant(agreement.tenantId, agreement.landlordId, userId);
    if (
      agreement.status !== AgreementStatus.ACTIVE ||
      (agreement.endDate && agreement.endDate <= new Date())
    ) {
      if (
        agreement.status === AgreementStatus.ACTIVE &&
        agreement.endDate &&
        agreement.endDate <= new Date()
      ) {
        await this.prisma.agreement.updateMany({
          where: { id, status: AgreementStatus.ACTIVE },
          data: { status: AgreementStatus.EXPIRED },
        });
      }
      throw new BadRequestException('Only active agreements can be terminated');
    }

    const pending = await this.prisma.agreementTerminationRequest.findFirst({
      where: { agreementId: id, status: AgreementTerminationRequestStatus.PENDING },
    });
    if (pending) throw new ConflictException('A cancellation request is already waiting for a response');

    try {
      const recipientId = userId === agreement.tenantId ? agreement.landlordId : agreement.tenantId;
      return await this.prisma.$transaction(async (transaction) => {
        const request = await transaction.agreementTerminationRequest.create({
          data: { agreementId: id, requestedById: userId, requestReason: reason, pendingAgreementId: id },
        });
        await this.notifyUnlessViewing(transaction, id, recipientId, {
          type: NotificationType.SYSTEM,
          title: 'Agreement cancellation requested',
          message: `The ${userId === agreement.tenantId ? 'tenant' : 'landlord'} requested to cancel the agreement. Reason: ${reason}`,
          data: { agreementId: id, terminationRequestId: request.id, href: recipientId === agreement.tenantId ? '/dashboard/my-agreements' : '/dashboard/property-agreements' },
        });
        return request;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A cancellation request is already waiting for a response');
      }
      throw error;
    }
  }

  async respondToTerminationRequest(id: string, requestId: string, userId: string, dto: RespondTerminationRequestDto) {
    const agreement = await this.prisma.agreement.findUnique({
      where: { id },
      select: { id: true, listingId: true, propertyId: true, tenantId: true, landlordId: true, status: true, endDate: true, listing: { select: { propertyId: true, title: true } }, property: { select: { title: true } } },
    });
    if (!agreement) throw new NotFoundException('Agreement not found');
    this.assertParticipant(agreement.tenantId, agreement.landlordId, userId);
    this.assertAmendable(agreement.status, agreement.endDate);
    if (dto.decision === 'REJECT' && !dto.reason?.trim()) {
      throw new BadRequestException('A rejection reason is required');
    }

    return this.prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${agreement.propertyId ?? agreement.listingId}))`);
      const request = await transaction.agreementTerminationRequest.findFirst({ where: { id: requestId, agreementId: id } });
      if (!request) throw new NotFoundException('Cancellation request not found');
      if (request.requestedById === userId) throw new ForbiddenException('You cannot respond to your own cancellation request');
      if (request.status !== AgreementTerminationRequestStatus.PENDING) throw new BadRequestException('This cancellation request has already been answered');
      const approved = dto.decision === 'APPROVE';
      const changed = await transaction.agreementTerminationRequest.updateMany({
        where: { id: requestId, status: AgreementTerminationRequestStatus.PENDING },
        data: {
          status: approved ? AgreementTerminationRequestStatus.APPROVED : AgreementTerminationRequestStatus.REJECTED,
          respondedById: userId,
          decisionReason: dto.reason?.trim() || null,
          reviewRating: null,
          reviewComment: null,
          decidedAt: new Date(),
          pendingAgreementId: null,
        },
      });
      if (changed.count !== 1) throw new BadRequestException('This cancellation request has already been answered');
      await transaction.agreementTerminationResponse.create({
        data: {
          terminationRequestId: requestId,
          responderId: userId,
          decision: approved ? AgreementTerminationResponseDecision.APPROVED : AgreementTerminationResponseDecision.REJECTED,
          reason: dto.reason?.trim() || null,
          reviewRating: null,
          reviewComment: null,
        },
      });
      if (approved) {
        await transaction.agreement.update({ where: { id }, data: { status: AgreementStatus.TERMINATED, terminationReason: request.requestReason } });
      } else {
        const title = agreement.property?.title ?? agreement.listing?.title ?? 'Rental property';
        await this.notifyUnlessViewing(transaction, id, request.requestedById, {
          type: NotificationType.SYSTEM,
          title: 'Agreement cancellation rejected',
          message: `Your cancellation request was rejected. Reason: ${dto.reason!.trim()}`,
          data: { agreementId: id, terminationRequestId: requestId, href: request.requestedById === agreement.tenantId ? '/dashboard/my-agreements' : '/dashboard/property-agreements' },
        });
        await this.notifyOnRepeatedRejection(transaction, agreement, userId, request.requestedById, title, dto.reason!.trim());
      }
      if (approved) {
        await this.notifyUnlessViewing(transaction, id, request.requestedById, {
          type: NotificationType.SYSTEM,
          title: 'Agreement cancellation approved',
          message: `Your cancellation request was approved. Reason: ${request.requestReason}`,
          data: { agreementId: id, terminationRequestId: requestId, href: request.requestedById === agreement.tenantId ? '/dashboard/my-agreements' : '/dashboard/property-agreements' },
        });
      }
      return transaction.agreement.findUniqueOrThrow({ where: { id }, include: this.agreementInclude(userId) });
    });
  }

  async respondToTerminationOutcome(id: string, requestId: string, userId: string, dto: RespondTerminationOutcomeDto) {
    const agreement = await this.prisma.agreement.findUnique({
      where: { id },
      select: { id: true, tenantId: true, landlordId: true, status: true, endDate: true },
    });
    if (!agreement) throw new NotFoundException('Agreement not found');
    this.assertParticipant(agreement.tenantId, agreement.landlordId, userId);
    this.assertAmendable(agreement.status, agreement.endDate);
    if (dto.decision === 'CONTEST' && !dto.reason?.trim()) {
      throw new BadRequestException('A reason is required to contest the rejection');
    }

    return this.prisma.$transaction(async (transaction) => {
      const request = await transaction.agreementTerminationRequest.findFirst({ where: { id: requestId, agreementId: id } });
      if (!request) throw new NotFoundException('Cancellation request not found');
      if (request.requestedById !== userId) throw new ForbiddenException('Only the requester can respond to this rejection');
      if (request.status !== AgreementTerminationRequestStatus.REJECTED) throw new BadRequestException('Only rejected cancellation requests can be accepted or contested');
      const contesting = dto.decision === 'CONTEST';
      const transition = await transaction.agreementTerminationRequest.updateMany({
        where: { id: requestId, status: AgreementTerminationRequestStatus.REJECTED },
        data: contesting
          ? { status: AgreementTerminationRequestStatus.PENDING, pendingAgreementId: id, respondedById: null, decisionReason: null, reviewRating: null, reviewComment: null, decidedAt: null }
          : { status: AgreementTerminationRequestStatus.CLOSED, pendingAgreementId: null },
      });
      if (transition.count !== 1) throw new BadRequestException('This rejection has already been answered');
      await transaction.agreementTerminationResponse.create({
        data: {
          terminationRequestId: requestId,
          responderId: userId,
          decision: contesting ? AgreementTerminationResponseDecision.CONTESTED : AgreementTerminationResponseDecision.ACCEPTED_REJECTION,
          reason: dto.reason?.trim() || null,
        },
      });
      const otherPartyId = userId === agreement.tenantId ? agreement.landlordId : agreement.tenantId;
      await this.notifyUnlessViewing(transaction, id, otherPartyId, {
        type: NotificationType.SYSTEM,
        title: contesting ? 'Cancellation rejection contested' : 'Cancellation rejection accepted',
        message: contesting
          ? `The requester contested your rejection. Reason: ${dto.reason!.trim()}. Please decide again.`
          : 'The requester accepted your rejection. The cancellation request is closed and the agreement stays active.',
        data: { agreementId: id, terminationRequestId: requestId, href: otherPartyId === agreement.tenantId ? '/dashboard/my-agreements' : '/dashboard/property-agreements' },
      });
      return transaction.agreement.findUniqueOrThrow({ where: { id }, include: this.agreementInclude(userId) });
    });
  }

  async proposeAmendment(id: string, userId: string, dto: CreateAgreementAmendmentDto) {
    const agreement = await this.prisma.agreement.findUnique({
      where: { id },
      select: { id: true, listingId: true, propertyId: true, tenantId: true, landlordId: true, status: true, endDate: true, property: { select: { title: true } }, listing: { select: { title: true } } },
    });
    if (!agreement) throw new NotFoundException('Agreement not found');
    if (agreement.landlordId !== userId) throw new ForbiddenException('Only the landlord can propose updated terms');
    this.assertAmendable(agreement.status, agreement.endDate);

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const amendment = await transaction.agreementAmendment.create({
          data: {
            agreementId: id,
            pendingAgreementId: id,
            proposedById: userId,
            proposedMonthlyRent: dto.proposedMonthlyRent,
            proposedSecurityDeposit: dto.proposedSecurityDeposit,
            reason: dto.reason || null,
          },
        });
        await this.notifyUnlessViewing(transaction, id, agreement.tenantId, {
          type: NotificationType.SYSTEM,
          title: 'Agreement update requested',
          message: `Your landlord proposed new rent (PKR ${dto.proposedMonthlyRent.toLocaleString()}) and security deposit (PKR ${dto.proposedSecurityDeposit.toLocaleString()}). Review and respond to the request.`,
          data: { agreementId: id, amendmentId: amendment.id, href: '/dashboard/my-agreements' },
        });
        return amendment;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('There is already an agreement update waiting for the tenant');
      }
      throw error;
    }
  }

  async respondToAmendment(id: string, amendmentId: string, userId: string, dto: RespondAgreementAmendmentDto) {
    const agreement = await this.prisma.agreement.findUnique({
      where: { id },
      select: { id: true, listingId: true, propertyId: true, tenantId: true, landlordId: true, status: true, endDate: true, property: { select: { title: true } }, listing: { select: { title: true } } },
    });
    if (!agreement) throw new NotFoundException('Agreement not found');
    if (agreement.tenantId !== userId) throw new ForbiddenException('Only the tenant can respond to proposed terms');
    this.assertAmendable(agreement.status, agreement.endDate);
    if (dto.decision === 'REJECT' && !dto.reason?.trim()) {
      throw new BadRequestException('A rejection reason is required');
    }

    return this.prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${agreement.propertyId ?? agreement.listingId}))`);
      const amendment = await transaction.agreementAmendment.findFirst({ where: { id: amendmentId, agreementId: id } });
      if (!amendment) throw new NotFoundException('Agreement update request not found');
      if (amendment.status !== AgreementAmendmentStatus.PENDING) {
        throw new BadRequestException('This agreement update has already been answered');
      }
      const accepted = dto.decision === 'ACCEPT';
      const changed = await transaction.agreementAmendment.updateMany({
        where: { id: amendmentId, agreementId: id, status: AgreementAmendmentStatus.PENDING },
        data: {
          status: accepted ? AgreementAmendmentStatus.ACCEPTED : AgreementAmendmentStatus.REJECTED,
          decidedById: userId,
          decidedAt: new Date(),
          pendingAgreementId: null,
          decisionNote: dto.reason?.trim() || null,
          reviewRating: null,
          reviewComment: null,
        },
      });
      if (changed.count !== 1) throw new BadRequestException('This agreement update has already been answered');
      if (accepted) {
        await transaction.agreement.update({
          where: { id },
          data: { monthlyRent: amendment.proposedMonthlyRent, securityDeposit: amendment.proposedSecurityDeposit },
        });
      }
      await this.notifyUnlessViewing(transaction, id, agreement.landlordId, {
        type: NotificationType.SYSTEM,
        title: accepted ? 'Agreement update accepted' : 'Agreement update rejected',
        message: accepted
          ? 'The tenant accepted your proposed rent and security deposit. The agreement terms have been updated.'
          : `The tenant rejected your proposed rent and security deposit. The existing agreement terms remain unchanged. Reason: ${dto.reason!.trim()}`,
        data: { agreementId: id, amendmentId, href: '/dashboard/property-agreements' },
      });
      if (!accepted) {
        const escalationContext = await transaction.agreement.findUniqueOrThrow({
          where: { id },
          select: { id: true, listingId: true, propertyId: true, tenantId: true, landlordId: true },
        });
        await this.notifyOnRepeatedRejection(
          transaction, escalationContext, userId, null,
          agreement.property?.title ?? agreement.listing?.title ?? 'Rental property', dto.reason!.trim(),
        );
      }
      return transaction.agreement.findUniqueOrThrow({ where: { id }, include: this.agreementInclude(userId) });
    });
  }

  private assertAmendable(status: AgreementStatus, endDate: Date | null) {
    if (status !== AgreementStatus.ACTIVE || (endDate && endDate <= new Date())) {
      throw new BadRequestException('Only active agreements can be updated');
    }
  }

  private async notifyOnRepeatedRejection(
    transaction: Prisma.TransactionClient,
    agreement: { id: string; listingId: string; propertyId: string | null; tenantId: string; landlordId: string },
    rejectorId: string,
    cancellationRequesterId: string | null,
    propertyTitle: string,
    rejectionReason: string,
  ) {
    const counts = await this.getRejectionCounts(transaction, agreement);
    if (counts.tenant < 3 || counts.landlord < 3) return;
    const admins = await transaction.user.findMany({ where: { roles: { has: Role.ADMIN } }, select: { id: true } });
    if (!admins.length) return;

    const scopeId = agreement.propertyId ? `property:${agreement.propertyId}` : `listing:${agreement.listingId}`;
    const escalated = await transaction.agreementRejectionEscalation.createMany({
      data: [{
        scopeId,
        propertyId: agreement.propertyId,
        listingId: agreement.listingId,
        propertyTitle,
        tenantId: agreement.tenantId,
        landlordId: agreement.landlordId,
        tenantRejections: counts.tenant,
        landlordRejections: counts.landlord,
      }],
      skipDuplicates: true,
    });
    if (!escalated.count) return;

    const rejectorRole = rejectorId === agreement.tenantId ? 'Tenant' : 'Landlord';
    const requesterRole = cancellationRequesterId
      ? `${cancellationRequesterId === agreement.tenantId ? 'Tenant' : 'Landlord'} ${cancellationRequesterId}`
      : 'none for the latest rent/deposit rejection';
    await transaction.notification.createMany({
      data: admins.map(({ id: adminId }) => ({
        userId: adminId,
        type: NotificationType.SYSTEM,
        title: 'Repeated agreement rejections need review',
        message: `Property: ${propertyTitle}. Tenant ID: ${agreement.tenantId}. Landlord ID: ${agreement.landlordId}. Both parties have at least 3 rejections for this property (tenant: ${counts.tenant}; landlord: ${counts.landlord}). Latest rejection by: ${rejectorRole} ${rejectorId}. Latest rejection reason: ${rejectionReason}. Cancellation requester: ${requesterRole}. Please review and resolve the issue.`,
        data: { agreementId: agreement.id, propertyId: agreement.propertyId, listingId: agreement.listingId, tenantId: agreement.tenantId, landlordId: agreement.landlordId, rejectingUserId: rejectorId, cancellationRequesterId, href: '/admin/agreements' },
      })),
    });
    await Promise.all([agreement.tenantId, agreement.landlordId].map((participantId) =>
      this.notifyUnlessViewing(transaction, agreement.id, participantId, {
        type: NotificationType.SYSTEM,
        title: 'Agreement dispute option is available',
        message: 'Both parties have reached the rejection threshold. You can now submit this agreement issue to a Rentra admin for review.',
        data: { agreementId: agreement.id, propertyId: agreement.propertyId, href: participantId === agreement.tenantId ? '/dashboard/my-agreements' : '/dashboard/property-agreements' },
      }),
    ));
  }

  private async getRejectionCounts(
    client: Prisma.TransactionClient | PrismaService,
    agreement: { listingId: string; propertyId: string | null; tenantId: string; landlordId: string },
  ) {
    const agreementScope: Prisma.AgreementWhereInput = agreement.propertyId
      ? { OR: [{ propertyId: agreement.propertyId }, { listing: { propertyId: agreement.propertyId } }] }
      : { listingId: agreement.listingId };
    const [tenantAmendments, landlordAmendments, tenantCancellations, landlordCancellations] = await Promise.all([
      client.agreementAmendment.count({ where: { status: AgreementAmendmentStatus.REJECTED, decidedById: agreement.tenantId, agreement: agreementScope } }),
      client.agreementAmendment.count({ where: { status: AgreementAmendmentStatus.REJECTED, decidedById: agreement.landlordId, agreement: agreementScope } }),
      client.agreementTerminationResponse.count({ where: { decision: AgreementTerminationResponseDecision.REJECTED, responderId: agreement.tenantId, terminationRequest: { agreement: agreementScope } } }),
      client.agreementTerminationResponse.count({ where: { decision: AgreementTerminationResponseDecision.REJECTED, responderId: agreement.landlordId, terminationRequest: { agreement: agreementScope } } }),
    ]);
    return { tenant: tenantAmendments + tenantCancellations, landlord: landlordAmendments + landlordCancellations };
  }

  private async withDisputeEligibility<T extends { listingId: string; propertyId: string | null; tenantId: string; landlordId: string }>(agreement: T) {
    const rejections = await this.getRejectionCounts(this.prisma, agreement);
    return {
      ...agreement,
      disputeEligibility: { ...rejections, eligible: rejections.tenant >= 3 && rejections.landlord >= 3 },
    };
  }

  private async notifyUnlessViewing(
    transaction: Prisma.TransactionClient,
    agreementId: string,
    userId: string,
    notification: { type: NotificationType; title: string; message: string; data: Prisma.InputJsonValue },
  ) {
    const viewing = await transaction.agreementPresence.findFirst({
      where: { agreementId, userId, seenAt: { gte: new Date(Date.now() - 30_000) } },
      select: { id: true },
    });
    if (viewing) return null;
    return transaction.notification.create({ data: { userId, ...notification } });
  }

  private async expireElapsedAgreements(userId: string, agreementId?: string) {
    await this.prisma.agreement.updateMany({
      where: {
        ...(agreementId ? { id: agreementId } : {}),
        OR: [{ tenantId: userId }, { landlordId: userId }],
        status: AgreementStatus.ACTIVE,
        endDate: { lte: new Date() },
      },
      data: { status: AgreementStatus.EXPIRED },
    });
  }

  private assertParticipant(
    tenantId: string,
    landlordId: string,
    userId: string,
  ) {
    if (tenantId !== userId && landlordId !== userId) {
      throw new ForbiddenException('You cannot access this agreement');
    }
  }

  private agreementInclude(userId: string) {
    return {
      tenant: {
        select: { id: true, fullName: true, email: true, phone: true },
      },
      landlord: {
        select: { id: true, fullName: true, email: true, phone: true },
      },
      property: { select: { id: true, title: true, propertyType: true, city: true, area: true, address: true } },
      listing: { select: { id: true, title: true, type: true, city: true, area: true, address: true } },
      rentalRequest: {
        select: {
          id: true,
          status: true,
          moveInDate: true,
          durationMonths: true,
        },
      },
      payments: {
        orderBy: { billingMonth: 'desc' as const },
      },
      amendments: { orderBy: { createdAt: 'desc' as const } },
      terminationRequests: {
        orderBy: { createdAt: 'desc' as const },
        include: {
          responses: { orderBy: { createdAt: 'asc' as const } },
          reviews: { orderBy: { createdAt: 'asc' as const }, select: { id: true, reviewerId: true, targetUserId: true, rating: true, comment: true, createdAt: true } },
        },
      },
    } satisfies Prisma.AgreementInclude;
  }
}
