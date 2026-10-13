import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AgreementStatus,
  BookingStatus,
  Prisma,
  ReviewTargetType,
  ReviewType,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';

const publicReviewer = {
  id: true,
  fullName: true,
  profile: { select: { avatarUrl: true } },
} satisfies Prisma.UserSelect;

const reviewInclude = {
  user: { select: publicReviewer },
  listing: { select: { id: true, title: true, city: true, area: true } },
  property: { select: { id: true, title: true, city: true, area: true } },
} satisfies Prisma.ReviewInclude;

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateReviewDto) {
    if (Boolean(dto.bookingId) === Boolean(dto.agreementId)) {
      throw new BadRequestException(
        'Provide exactly one of bookingId or agreementId',
      );
    }

    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      select: {
        id: true,
        landlordId: true,
        propertyId: true,
        property: { select: { ownerId: true } },
      },
    });
    if (!listing) throw new NotFoundException('Listing/property not found');

    const rental = dto.bookingId
      ? await this.assertCompletedBooking(
          dto.bookingId,
          userId,
          listing.id,
          listing.propertyId,
        )
      : await this.assertCompletedAgreement(
          dto.agreementId!,
          userId,
          listing.id,
          listing.propertyId,
          listing.landlordId,
        );

    if (listing.landlordId === userId || listing.property?.ownerId === userId) {
      throw new ForbiddenException('You cannot review your own property');
    }
    if (rental.landlordId && rental.landlordId !== listing.landlordId) {
      throw new BadRequestException(
        'The rental landlord does not match the listing landlord',
      );
    }

    try {
      return await this.prisma.review.create({
        data: {
          userId,
          listingId: listing.id,
          propertyId: listing.propertyId,
          bookingId: dto.bookingId,
          agreementId: dto.agreementId,
          landlordId:
            dto.reviewType === ReviewType.LANDLORD
              ? listing.landlordId
              : undefined,
          reviewType: dto.reviewType,
          targetType:
            dto.reviewType === ReviewType.LANDLORD
              ? ReviewTargetType.HOST
              : ReviewTargetType.PROPERTY,
          rating: dto.rating,
          comment: dto.comment?.trim() || null,
          cleanliness: dto.cleanliness,
          location: dto.location,
          accuracy: dto.accuracy,
          communication: dto.communication,
          facilities: dto.facilities,
        },
        include: reviewInclude,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'You have already submitted this type of review for the rental',
        );
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      include: reviewInclude,
    });
  }

  async findById(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: reviewInclude,
    });
    if (!review) throw new NotFoundException('Review not found');
    return review;
  }

  async getByListing(listingId: string) {
    return this.prisma.review.findMany({
      where: { listingId, reviewType: ReviewType.PROPERTY },
      orderBy: { createdAt: 'desc' },
      include: reviewInclude,
    });
  }

  async getAverageRating(listingId: string) {
    const result = await this.prisma.review.aggregate({
      where: {
        listingId,
        reviewType: ReviewType.PROPERTY,
      },
      _avg: { rating: true },
    });
    return result._avg.rating ?? 0;
  }

  async getPropertyReviews(id: string, query: ReviewQueryDto) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      select: { id: true },
    });
    const listing = property
      ? null
      : await this.prisma.listing.findUnique({
          where: { id },
          select: { id: true },
        });
    if (!property && !listing)
      throw new NotFoundException('Property not found');

    const where: Prisma.ReviewWhereInput = {
      reviewType: ReviewType.PROPERTY,
      ...(property
        ? {
            OR: [
              { propertyId: property.id },
              { listing: { propertyId: property.id } },
            ],
          }
        : { listingId: listing!.id }),
    };
    return this.paginate(where, query);
  }

  async getLandlordReviews(userId: string, query: ReviewQueryDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.paginate(
      { reviewType: ReviewType.LANDLORD, landlordId: user.id },
      query,
    );
  }

  async delete(id: string, userId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== userId) {
      throw new ForbiddenException('You cannot delete this review');
    }
    return this.prisma.review.delete({ where: { id } });
  }

  private async paginate(
    where: Prisma.ReviewWhereInput,
    query: ReviewQueryDto,
  ) {
    const skip = (query.page - 1) * query.limit;
    const [data, aggregate] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
        include: reviewInclude,
      }),
      this.prisma.review.aggregate({
        where,
        _count: { _all: true },
        _avg: { rating: true },
      }),
    ]);
    const totalCount = aggregate._count._all;
    return {
      data,
      totalCount,
      count: totalCount,
      averageRating: aggregate._avg.rating ?? 0,
      pagination: {
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(totalCount / query.limit),
      },
    };
  }

  private async assertCompletedBooking(
    bookingId: string,
    userId: string,
    listingId: string,
    propertyId: string | null,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        tenantId: true,
        listingId: true,
        propertyId: true,
        status: true,
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.tenantId !== userId) {
      throw new ForbiddenException(
        'Only the booking tenant can submit a review',
      );
    }
    if (
      booking.status !== BookingStatus.COMPLETED ||
      !this.rentalMatchesListing(
        booking.listingId,
        booking.propertyId,
        listingId,
        propertyId,
      )
    ) {
      throw new ForbiddenException(
        'A completed rental for this listing is required to submit a review',
      );
    }
    return { landlordId: null as string | null };
  }

  private async assertCompletedAgreement(
    agreementId: string,
    userId: string,
    listingId: string,
    propertyId: string | null,
    listingLandlordId: string,
  ) {
    const agreement = await this.prisma.agreement.findUnique({
      where: { id: agreementId },
      select: {
        id: true,
        tenantId: true,
        landlordId: true,
        listingId: true,
        propertyId: true,
        endDate: true,
        status: true,
      },
    });
    if (!agreement) throw new NotFoundException('Agreement not found');
    if (agreement.tenantId !== userId) {
      throw new ForbiddenException(
        'Only the agreement tenant can submit a review',
      );
    }
    const completionStatuses: AgreementStatus[] = [
      AgreementStatus.ENDED,
      AgreementStatus.EXPIRED,
      AgreementStatus.TERMINATED,
    ];
    if (
      !completionStatuses.includes(agreement.status) ||
      !agreement.endDate ||
      agreement.endDate > new Date() ||
      !this.rentalMatchesListing(
        agreement.listingId,
        agreement.propertyId,
        listingId,
        propertyId,
      )
    ) {
      throw new ForbiddenException(
        'A completed, ended agreement for this listing is required to submit a review',
      );
    }
    if (agreement.landlordId !== listingLandlordId) {
      throw new BadRequestException(
        'The agreement landlord does not match the listing landlord',
      );
    }
    return { landlordId: agreement.landlordId };
  }

  private rentalMatchesListing(
    rentalListingId: string | null,
    rentalPropertyId: string | null,
    listingId: string,
    propertyId: string | null,
  ) {
    return (
      rentalListingId === listingId ||
      (rentalListingId === null &&
        rentalPropertyId !== null &&
        rentalPropertyId === propertyId)
    );
  }
}
