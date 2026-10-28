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
  NotificationType,
  Prisma,
  PropertyStatus,
  RentalRequestStatus,
  VerificationKind,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { requiresVerifiedPhoneForTenantRequests } from '../../common/phone-verification-policy';
import { AcceptRentalRequestDto } from './dto/accept-rental-request.dto';
import { CreateRentalRequestDto } from './dto/create-rental-request.dto';

@Injectable()
export class RentalRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: string,
    propertyId: string,
    dto: CreateRentalRequestDto,
  ) {
    await this.requireVerifiedPhone(tenantId);
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, status: PropertyStatus.ACTIVE },
      include: {
        owner: { select: { id: true, fullName: true } },
        listings: {
          take: 1,
          orderBy: { createdAt: 'asc' },
          select: { id: true },
        },
      },
    });
    if (!property) throw new NotFoundException('Active property not found');
    if (property.ownerId === tenantId) {
      throw new BadRequestException('You cannot request your own property');
    }

    const existing = await this.prisma.rentalRequest.findFirst({
      where: {
        tenantId,
        propertyId,
        status: {
          in: [RentalRequestStatus.PENDING, RentalRequestStatus.ACCEPTED],
        },
      },
    });
    if (existing)
      throw new BadRequestException(
        'You already have an active request for this property',
      );

    const moveInDate = dto.moveInDate ? new Date(dto.moveInDate) : null;
    if (moveInDate && Number.isNaN(moveInDate.getTime())) {
      throw new BadRequestException('moveInDate must be a valid date');
    }

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const request = await transaction.rentalRequest.create({
          data: {
            tenantId,
            landlordId: property.ownerId,
            propertyId,
            listingId: property.listings[0]?.id,
            moveInDate,
            durationMonths: dto.duration,
            occupants: dto.occupants ?? 1,
            message: dto.message?.trim(),
            status: RentalRequestStatus.PENDING,
          },
          include: this.requestInclude(),
        });

        await transaction.notification.create({
          data: {
            userId: property.ownerId,
            type: NotificationType.RENTAL_REQUEST,
            title: 'New rental request',
            message: 'A tenant sent a rental request for your property',
            data: { rentalRequestId: request.id, propertyId, href: `/dashboard/received-requests?requestId=${request.id}` },
          },
        });
        return request;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A rental request for this listing has already been submitted',
        );
      }
      throw error;
    }
  }

  private async requireVerifiedPhone(userId: string) {
    if (!requiresVerifiedPhoneForTenantRequests()) return;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phoneVerifiedAt: true },
    });
    if (!user?.phoneVerifiedAt) {
      throw new ForbiddenException(
        'Verify your phone number before sending a rental request.',
      );
    }
  }

  async myRequests(tenantId: string) {
    const requests = await this.prisma.rentalRequest.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: this.requestInclude(),
    });
    if (!requests.length) return requests;
    const activity = await this.prisma.moderationAuditEvent.findMany({
      where: {
        entityType: 'RENTAL_REQUEST',
        entityId: { in: requests.map(({ id }) => id) },
        action: { in: ['RENTAL_REQUEST_INFORMATION_REQUESTED', 'RENTAL_REQUEST_INFORMATION_RESPONDED'] },
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true, entityId: true, action: true, actorRole: true, reason: true, createdAt: true },
    });
    const threadByRequest = new Map<string, typeof activity>();
    for (const item of activity) threadByRequest.set(item.entityId, [...(threadByRequest.get(item.entityId) ?? []), item]);
    return requests.map((request) => ({ ...request, informationThread: threadByRequest.get(request.id) ?? [] }));
  }

  receivedRequests(landlordId: string) {
    return this.prisma.rentalRequest.findMany({
      where: { landlordId },
      orderBy: { createdAt: 'desc' },
      include: this.requestInclude({ includeTenantReviewStatus: true }),
    });
  }

  async getTenantReviewProfile(requestId: string, landlordId: string) {
    const request = await this.prisma.rentalRequest.findFirst({
      where: { id: requestId, landlordId },
      select: {
        id: true,
        tenantId: true,
        landlordId: true,
        status: true,
        moveInDate: true,
        durationMonths: true,
        occupants: true,
        message: true,
        createdAt: true,
        propertyId: true,
        property: {
          select: {
            ownerId: true, id: true, title: true, city: true, area: true, price: true,
            images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true, altText: true } },
          },
        },
      },
    });
    if (!request) throw new NotFoundException('Rental request not found');
    if (!request.property || request.property.ownerId !== landlordId) {
      throw new ForbiddenException('Only the current property owner can review this tenant');
    }

    const [tenant, completedAgreements, completedBookings, recentAgreements, recentBookings, reviews] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: request.tenantId },
        select: {
          id: true,
          fullName: true,
          email: true,
          emailVerifiedAt: true,
          phoneVerifiedAt: true,
          createdAt: true,
          trustScore: true,
          profile: { select: { bio: true, avatarUrl: true, city: true, country: true } },
          verificationSubmissions: {
            where: { kind: VerificationKind.IDENTITY },
            orderBy: { submittedAt: 'desc' },
            take: 1,
            select: { status: true, submittedAt: true, reviewedAt: true },
          },
        },
      }),
      this.prisma.agreement.count({ where: { tenantId: request.tenantId, status: AgreementStatus.ENDED } }),
      this.prisma.booking.count({ where: { tenantId: request.tenantId, status: 'COMPLETED' } }),
      this.prisma.agreement.findMany({
        where: { tenantId: request.tenantId, status: AgreementStatus.ENDED },
        orderBy: { endDate: 'desc' }, take: 5,
        select: { id: true, startDate: true, endDate: true, property: { select: { title: true, city: true, area: true } }, listing: { select: { title: true, city: true, area: true } } },
      }),
      this.prisma.booking.findMany({
        where: { tenantId: request.tenantId, status: 'COMPLETED' },
        orderBy: { endDate: 'desc' }, take: 5,
        select: { id: true, startDate: true, endDate: true, property: { select: { title: true, city: true, area: true } }, listing: { select: { title: true, city: true, area: true } } },
      }),
      this.prisma.review.aggregate({ where: { userId: request.tenantId }, _count: { _all: true }, _avg: { rating: true } }),
    ]);
    if (!tenant) throw new NotFoundException('Tenant profile not found');

    const identity = tenant.verificationSubmissions[0];
    const identityStatus = !identity ? 'NOT_STARTED'
      : identity.status === 'APPROVED' ? 'VERIFIED'
        : identity.status === 'REJECTED' ? 'FAILED'
          : identity.status === 'PENDING' ? 'PENDING' : 'NOT_STARTED';
    const profileFields = [tenant.fullName, tenant.email, tenant.profile?.bio, tenant.profile?.avatarUrl, tenant.profile?.city, tenant.phoneVerifiedAt];
    const completedFields = profileFields.filter(Boolean).length;

    return {
      request: {
        id: request.id,
        status: request.status,
        moveInDate: request.moveInDate,
        durationMonths: request.durationMonths,
        occupants: request.occupants,
        message: request.message,
        createdAt: request.createdAt,
        property: request.property ? {
          id: request.property.id,
          title: request.property.title,
          city: request.property.city,
          area: request.property.area,
          price: request.property.price,
          image: request.property.images[0] ?? null,
        } : null,
      },
      tenant: {
        id: tenant.id,
        fullName: tenant.fullName,
        email: tenant.email,
        emailVerified: Boolean(tenant.emailVerifiedAt),
        emailVerifiedAt: tenant.emailVerifiedAt,
        phoneVerified: Boolean(tenant.phoneVerifiedAt),
        phoneVerifiedAt: tenant.phoneVerifiedAt,
        identityVerification: { status: identityStatus, submittedAt: identity?.submittedAt ?? null, reviewedAt: identity?.reviewedAt ?? null },
        profile: tenant.profile,
        profileCompletion: Math.round((completedFields / profileFields.length) * 100),
        memberSince: tenant.createdAt,
        trustScore: Number.isInteger(tenant.trustScore) ? tenant.trustScore : null,
        completedRentals: completedAgreements + completedBookings,
        completedRentalHistory: [
          ...recentAgreements.map((rental) => ({ id: rental.id, type: 'AGREEMENT', startDate: rental.startDate, endDate: rental.endDate ?? rental.startDate, propertyTitle: rental.property?.title ?? rental.listing?.title ?? 'Rental property', city: rental.property?.city ?? rental.listing?.city ?? null, area: rental.property?.area ?? rental.listing?.area ?? null })),
          ...recentBookings.map((rental) => ({ id: rental.id, type: 'BOOKING', startDate: rental.startDate, endDate: rental.endDate, propertyTitle: rental.property?.title ?? rental.listing?.title ?? 'Rental property', city: rental.property?.city ?? rental.listing?.city ?? null, area: rental.property?.area ?? rental.listing?.area ?? null })),
        ].sort((a, b) => b.endDate.getTime() - a.endDate.getTime()),
        publishedReviews: { count: reviews._count._all, averageRating: reviews._avg.rating },
      },
    };
  }

  async accept(
    requestId: string,
    landlordId: string,
    dto: AcceptRentalRequestDto = {},
  ) {
    const request = await this.prisma.rentalRequest.findUnique({
      where: { id: requestId },
      include: {
        property: true,
        listing: true,
      },
    });
    if (!request) throw new NotFoundException('Rental request not found');
    if (request.landlordId !== landlordId)
      throw new ForbiddenException(
        'Only the property owner can accept this request',
      );
    if (!request.property || request.property.ownerId !== landlordId) {
      throw new ForbiddenException('Only the current property owner can accept this request');
    }
    if (request.status !== RentalRequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be accepted');
    }
    const listing = request.listing;
    if (!listing)
      throw new BadRequestException(
        'Property has no linked listing for an agreement',
      );

    const parseAgreementDate = (value: string, field: string) => {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
      if (!match) {
        throw new BadRequestException(`${field} must use YYYY-MM-DD format`);
      }
      const date = new Date(`${value}T00:00:00.000Z`);
      if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value
      ) {
        throw new BadRequestException(`${field} must be a valid date`);
      }
      return date;
    };
    const startDate = dto.startDate
      ? parseAgreementDate(dto.startDate, 'startDate')
      : (request.moveInDate ?? new Date());
    if (Number.isNaN(startDate.getTime())) {
      throw new BadRequestException('Agreement startDate must be a valid date');
    }
    const endDate = dto.endDate
      ? parseAgreementDate(dto.endDate, 'endDate')
      : request.durationMonths
        ? new Date(startDate)
        : null;
    if (endDate && !dto.endDate && request.durationMonths) {
      const originalDay = endDate.getUTCDate();
      endDate.setUTCDate(1);
      endDate.setUTCMonth(endDate.getUTCMonth() + request.durationMonths);
      const lastDayOfTargetMonth = new Date(
        Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth() + 1, 0),
      ).getUTCDate();
      endDate.setUTCDate(Math.min(originalDay, lastDayOfTargetMonth));
    }
    if (endDate && endDate <= startDate) {
      throw new BadRequestException(
        'Agreement endDate must be after startDate',
      );
    }
    const monthlyRent =
      dto.monthlyRent ?? request.property?.price ?? listing.rent;
    const securityDeposit =
      dto.securityDeposit ??
      request.property?.securityDeposit ??
      listing.deposit ??
      0;
    const paymentDueDay = dto.paymentDueDay ?? 1;
    if (
      !Number.isSafeInteger(monthlyRent) ||
      monthlyRent < 0 ||
      !Number.isSafeInteger(securityDeposit) ||
      securityDeposit < 0 ||
      !Number.isInteger(paymentDueDay) ||
      paymentDueDay < 1 ||
      paymentDueDay > 28
    ) {
      throw new BadRequestException('Agreement payment terms are invalid');
    }

    const result = await this.prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${request.propertyId}))`,
      );
      const activeAgreement = await transaction.agreement.findFirst({
        where: {
          propertyId: request.propertyId,
          status: AgreementStatus.ACTIVE,
        },
        select: { id: true },
      });
      if (activeAgreement) {
        throw new ConflictException(
          'This property already has an active rental agreement',
        );
      }
      const transition = await transaction.rentalRequest.updateMany({
        where: {
          id: requestId,
          landlordId,
          status: RentalRequestStatus.PENDING,
        },
        data: { status: RentalRequestStatus.ACCEPTED },
      });
      if (transition.count !== 1) {
        throw new BadRequestException('Only pending requests can be accepted');
      }
      await this.recordRequestActivity(transaction, landlordId, requestId, 'RENTAL_REQUEST_ACCEPTED', 'PENDING', 'ACCEPTED');

      const agreement = await transaction.agreement.create({
        data: {
          tenantId: request.tenantId,
          landlordId: request.landlordId,
          listingId: listing.id,
          propertyId: request.propertyId,
          rentalRequestId: request.id,
          monthlyRent,
          securityDeposit,
          startDate,
          endDate,
          paymentDueDay,
          rules: dto.rules ?? listing.rules,
          status: AgreementStatus.ACTIVE,
        },
      });
      const competingRequests = await transaction.rentalRequest.findMany({
        where: {
          propertyId: request.propertyId,
          tenantId: { not: request.tenantId },
          status: RentalRequestStatus.PENDING,
        },
        select: { id: true, tenantId: true },
      });
      if (competingRequests.length) {
        for (const otherRequest of competingRequests) {
          const otherTransition = await transaction.rentalRequest.updateMany({
            where: { id: otherRequest.id, landlordId, status: RentalRequestStatus.PENDING },
            data: { status: RentalRequestStatus.REJECTED },
          });
          if (otherTransition.count !== 1) continue;
          await transaction.notification.create({
            data: {
              userId: otherRequest.tenantId,
              type: NotificationType.RENTAL_REQUEST_REJECTED,
              title: 'Rental request closed',
              message: 'This property is no longer available because another request was accepted.',
              data: { rentalRequestId: otherRequest.id, propertyId: request.propertyId, href: '/dashboard/my-requests' },
            },
          });
          await this.recordRequestActivity(transaction, landlordId, otherRequest.id, 'RENTAL_REQUEST_REJECTED', 'PENDING', 'REJECTED', 'Another tenant request was accepted');
        }
      }
      await transaction.notification.createMany({
        data: [
          {
            userId: request.tenantId,
            type: NotificationType.RENTAL_REQUEST_ACCEPTED,
            title: 'Rental request accepted',
            message:
              'Your rental request was accepted and an agreement was created',
            data: {
              rentalRequestId: request.id,
              agreementId: agreement.id,
              propertyId: request.propertyId,
              href: '/dashboard/my-requests',
            },
          },
          {
            userId: landlordId,
            type: NotificationType.RENTAL_REQUEST_ACCEPTED,
            title: 'Agreement created',
            message:
              'An agreement was created from the accepted rental request',
            data: {
              rentalRequestId: request.id,
              agreementId: agreement.id,
              propertyId: request.propertyId,
              href: '/dashboard/property-agreements',
            },
          },
        ],
      });
      const accepted = await transaction.rentalRequest.findUniqueOrThrow({
        where: { id: requestId },
        include: this.requestInclude(),
      });
      return { accepted, agreement };
    });

    return result;
  }

  async reject(requestId: string, landlordId: string, reason?: string) {
    const request = await this.getOwnedRequest(requestId, landlordId);
    if (request.status !== RentalRequestStatus.PENDING)
      throw new BadRequestException('Only pending requests can be rejected');
    return this.prisma.$transaction(async (transaction) => {
      const transition = await transaction.rentalRequest.updateMany({
        where: {
          id: requestId,
          landlordId,
          status: RentalRequestStatus.PENDING,
        },
        data: { status: RentalRequestStatus.REJECTED },
      });
      if (transition.count !== 1)
        throw new BadRequestException('Only pending requests can be rejected');
      await transaction.notification.create({
        data: {
          userId: request.tenantId,
          type: NotificationType.RENTAL_REQUEST_REJECTED,
          title: 'Rental request rejected',
          message: reason?.trim()
            ? `Your rental request was rejected. Reason: ${reason.trim()}`
            : 'Your rental request was rejected by the property owner',
          data: { rentalRequestId: requestId, propertyId: request.propertyId, href: '/dashboard/my-requests' },
        },
      });
      await this.recordRequestActivity(transaction, landlordId, requestId, 'RENTAL_REQUEST_REJECTED', 'PENDING', 'REJECTED', reason?.trim());
      return transaction.rentalRequest.findUniqueOrThrow({
        where: { id: requestId },
        include: this.requestInclude(),
      });
    });
  }

  async requestInformation(requestId: string, landlordId: string, message: string) {
    const request = await this.getOwnedRequest(requestId, landlordId);
    if (request.status !== RentalRequestStatus.PENDING) {
      throw new BadRequestException('Additional information can only be requested for pending requests');
    }
    const normalizedMessage = message.trim();
    if (!normalizedMessage) throw new BadRequestException('Information request message is required');
    return this.prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${`rental-info:${requestId}`}))`);
      const recentRequests = await transaction.moderationAuditEvent.count({
        where: {
          actorId: landlordId,
          entityType: 'RENTAL_REQUEST',
          entityId: requestId,
          action: 'RENTAL_REQUEST_INFORMATION_REQUESTED',
          createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
        },
      });
      if (recentRequests >= 3) throw new HttpException('You can request additional information up to three times per hour for each application.', HttpStatus.TOO_MANY_REQUESTS);
      await transaction.notification.create({
        data: {
          userId: request.tenantId,
          type: NotificationType.RENTAL_REQUEST,
          title: 'Landlord requested more information',
          message: normalizedMessage,
          data: { rentalRequestId: request.id, propertyId: request.propertyId, href: `/dashboard/my-requests?requestId=${request.id}` },
        },
      });
      await this.recordRequestActivity(transaction, landlordId, requestId, 'RENTAL_REQUEST_INFORMATION_REQUESTED', 'PENDING', 'PENDING', normalizedMessage);
      return { success: true };
    });
  }

  async respondToInformation(requestId: string, tenantId: string, message: string) {
    const normalizedMessage = message.trim();
    if (!normalizedMessage) throw new BadRequestException('Reply message is required');
    return this.prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${`rental-info:${requestId}`}))`);
      const request = await transaction.rentalRequest.findFirst({
        where: { id: requestId, tenantId, status: RentalRequestStatus.PENDING },
        select: { id: true, tenantId: true, landlordId: true, status: true },
      });
      if (!request) throw new NotFoundException('Pending rental request not found');
      const hasInformationRequest = await transaction.moderationAuditEvent.count({
        where: { entityType: 'RENTAL_REQUEST', entityId: requestId, action: 'RENTAL_REQUEST_INFORMATION_REQUESTED' },
      });
      if (!hasInformationRequest) throw new BadRequestException('The landlord has not requested additional information');
      await transaction.notification.create({
        data: {
          userId: request.landlordId,
          type: NotificationType.RENTAL_REQUEST,
          title: 'Tenant replied to your information request',
          message: normalizedMessage,
          data: { rentalRequestId: request.id, href: `/dashboard/received-requests?requestId=${request.id}` },
        },
      });
      await this.recordRequestActivity(transaction, tenantId, requestId, 'RENTAL_REQUEST_INFORMATION_RESPONDED', 'PENDING', 'PENDING', normalizedMessage, 'TENANT');
      return { success: true };
    });
  }

  async cancel(requestId: string, tenantId: string) {
    const request = await this.prisma.rentalRequest.findFirst({
      where: { id: requestId, tenantId },
    });
    if (!request) throw new NotFoundException('Rental request not found');
    if (request.status !== RentalRequestStatus.PENDING)
      throw new BadRequestException('Only pending requests can be cancelled');
    const transition = await this.prisma.rentalRequest.updateMany({
      where: {
        id: requestId,
        tenantId,
        status: RentalRequestStatus.PENDING,
      },
      data: { status: RentalRequestStatus.CANCELLED },
    });
    if (transition.count !== 1)
      throw new BadRequestException('Only pending requests can be cancelled');
    return this.prisma.rentalRequest.findUniqueOrThrow({
      where: { id: requestId },
      include: this.requestInclude(),
    });
  }

  private async getOwnedRequest(requestId: string, landlordId: string) {
    const request = await this.prisma.rentalRequest.findFirst({
      where: { id: requestId, landlordId },
    });
    if (!request) throw new NotFoundException('Rental request not found');
    if (!request.propertyId) throw new ForbiddenException('This request is no longer linked to an owned property');
    const property = await this.prisma.property.findUnique({ where: { id: request.propertyId }, select: { ownerId: true } });
    if (!property || property.ownerId !== landlordId) {
      throw new ForbiddenException('Only the current property owner can manage this request');
    }
    return request;
  }

  private recordRequestActivity(
    transaction: Prisma.TransactionClient,
    actorId: string,
    requestId: string,
    action: string,
    previousStatus: string,
    newStatus: string,
    reason?: string,
    actorRole = 'LANDLORD',
  ) {
    return transaction.moderationAuditEvent.create({
      data: {
        actorId,
        actorRole,
        entityType: 'RENTAL_REQUEST',
        entityId: requestId,
        action,
        previousStatus,
        newStatus,
        ...(reason && { reason }),
      },
    });
  }

  private requestInclude(options: { includeTenantReviewStatus?: boolean } = {}) {
    return {
      tenant: { select: {
        id: true,
        fullName: true,
        email: true,
        ...(options.includeTenantReviewStatus && {
          emailVerifiedAt: true,
          phoneVerifiedAt: true,
          trustScore: true,
          verificationSubmissions: {
            where: { kind: VerificationKind.IDENTITY },
            orderBy: { submittedAt: 'desc' as const },
            take: 1,
            select: { status: true, reviewedAt: true },
          },
        }),
      } },
      landlord: { select: { id: true, fullName: true } },
      property: {
        select: {
          id: true, title: true, price: true, city: true, area: true, securityDeposit: true,
          images: { orderBy: { sortOrder: 'asc' as const }, take: 1, select: { url: true, altText: true } },
        },
      },
      listing: { select: { id: true, title: true, rent: true, deposit: true, photos: true } },
      agreements: {
        select: { id: true, status: true, startDate: true, endDate: true },
      },
    } satisfies Prisma.RentalRequestInclude;
  }
}
