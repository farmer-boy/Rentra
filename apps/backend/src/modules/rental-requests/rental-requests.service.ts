import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AgreementStatus,
  NotificationType,
  Prisma,
  PropertyStatus,
  RentalRequestStatus,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateRentalRequestDto } from './dto/create-rental-request.dto';

@Injectable()
export class RentalRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    tenantId: string,
    propertyId: string,
    dto: CreateRentalRequestDto,
  ) {
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

    const request = await this.prisma.rentalRequest.create({
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

    await this.notificationsService.create({
      userId: property.ownerId,
      type: NotificationType.RENTAL_REQUEST,
      title: 'New rental request',
      message: 'A tenant sent a rental request for your property',
      data: { rentalRequestId: request.id, propertyId },
    });
    return request;
  }

  myRequests(tenantId: string) {
    return this.prisma.rentalRequest.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: this.requestInclude(),
    });
  }

  receivedRequests(landlordId: string) {
    return this.prisma.rentalRequest.findMany({
      where: { landlordId },
      orderBy: { createdAt: 'desc' },
      include: this.requestInclude(),
    });
  }

  async accept(requestId: string, landlordId: string) {
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
    if (request.status !== RentalRequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be accepted');
    }
    const listing = request.listing;
    if (!listing)
      throw new BadRequestException(
        'Property has no linked listing for an agreement',
      );

    const startDate = request.moveInDate ?? new Date();
    const endDate = request.durationMonths
      ? new Date(
          new Date(startDate).setMonth(
            startDate.getMonth() + request.durationMonths,
          ),
        )
      : null;

    const result = await this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${requestId}))`,
      );
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

      const agreement = await transaction.agreement.create({
        data: {
          tenantId: request.tenantId,
          landlordId: request.landlordId,
          listingId: listing.id,
          propertyId: request.propertyId,
          rentalRequestId: request.id,
          rent: request.property?.price ?? listing.rent,
          deposit: request.property?.securityDeposit ?? listing.deposit ?? 0,
          startDate,
          endDate,
          status: AgreementStatus.ACTIVE,
        },
      });
      await transaction.rentalRequest.updateMany({
        where: {
          propertyId: request.propertyId,
          tenantId: { not: request.tenantId },
          status: RentalRequestStatus.PENDING,
        },
        data: { status: RentalRequestStatus.REJECTED },
      });
      const accepted = await transaction.rentalRequest.findUniqueOrThrow({
        where: { id: requestId },
        include: this.requestInclude(),
      });
      return { accepted, agreement };
    });

    await Promise.all([
      this.notificationsService.create({
        userId: request.tenantId,
        type: NotificationType.RENTAL_REQUEST_ACCEPTED,
        title: 'Rental request accepted',
        message:
          'Your rental request was accepted and an agreement was created',
        data: {
          rentalRequestId: request.id,
          agreementId: result.agreement.id,
          propertyId: request.propertyId,
        },
      }),
      this.notificationsService.create({
        userId: landlordId,
        type: NotificationType.RENTAL_REQUEST_ACCEPTED,
        title: 'Agreement created',
        message: 'An agreement was created from the accepted rental request',
        data: {
          rentalRequestId: request.id,
          agreementId: result.agreement.id,
          propertyId: request.propertyId,
        },
      }),
    ]);
    return result;
  }

  async reject(requestId: string, landlordId: string) {
    const request = await this.getOwnedRequest(requestId, landlordId);
    if (request.status !== RentalRequestStatus.PENDING)
      throw new BadRequestException('Only pending requests can be rejected');
    const transition = await this.prisma.rentalRequest.updateMany({
      where: {
        id: requestId,
        landlordId,
        status: RentalRequestStatus.PENDING,
      },
      data: { status: RentalRequestStatus.REJECTED },
    });
    if (transition.count !== 1)
      throw new BadRequestException('Only pending requests can be rejected');
    const updated = await this.prisma.rentalRequest.findUniqueOrThrow({
      where: { id: requestId },
      include: this.requestInclude(),
    });
    await this.notificationsService.create({
      userId: request.tenantId,
      type: NotificationType.RENTAL_REQUEST_REJECTED,
      title: 'Rental request rejected',
      message: 'Your rental request was rejected by the property owner',
      data: { rentalRequestId: requestId, propertyId: request.propertyId },
    });
    return updated;
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
    return request;
  }

  private requestInclude() {
    return {
      tenant: { select: { id: true, fullName: true, email: true } },
      landlord: { select: { id: true, fullName: true } },
      property: {
        select: { id: true, title: true, price: true, city: true, area: true },
      },
      listing: { select: { id: true, title: true, rent: true } },
      agreements: {
        select: { id: true, status: true, startDate: true, endDate: true },
      },
    } satisfies Prisma.RentalRequestInclude;
  }
}
