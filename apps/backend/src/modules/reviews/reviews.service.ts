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
  TrustSource,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TrustScoreService } from '../trust-score/trust-score.service';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly trustScoreService: TrustScoreService,
  ) {}

  async create(userId: string, dto: CreateReviewDto) {
    if (
      dto.reviewType === ReviewType.LANDLORD ||
      dto.reviewType === ReviewType.TENANT
    ) {
      if (!dto.agreementId) {
        throw new BadRequestException(
          'Person-to-person reviews must be linked to a completed rental agreement',
        );
      }
      return this.createAgreementReview(userId, dto);
    }

    if (dto.rating === undefined) {
      throw new BadRequestException('A property review rating is required');
    }
    if (Boolean(dto.bookingId) === Boolean(dto.agreementId)) {
      throw new BadRequestException(
        'Provide exactly one of bookingId or agreementId',
      );
    }
    if (!dto.listingId) {
      throw new BadRequestException(
        'A listing is required for a property review',
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
          reviewType: dto.reviewType,
          targetType: ReviewTargetType.PROPERTY,
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

  private async createAgreementReview(userId: string, dto: CreateReviewDto) {
    if (!dto.agreementId)
      throw new BadRequestException('Agreement is required');

    const agreement = await this.getCompletedAgreement(dto.agreementId);
    const isTenantReview = dto.reviewType === ReviewType.TENANT;
    const expectedReviewerId = isTenantReview
      ? agreement.landlordId
      : agreement.tenantId;
    const targetUserId = isTenantReview
      ? agreement.tenantId
      : agreement.landlordId;

    if (userId !== expectedReviewerId) {
      throw new ForbiddenException(
        `Only the agreement ${isTenantReview ? 'landlord' : 'tenant'} can submit this review`,
      );
    }
    if (userId === targetUserId) {
      throw new ForbiddenException('You cannot review yourself');
    }

    const requiredRatings = isTenantReview
      ? [
          dto.behaviour,
          dto.rentPayment,
          dto.propertyCare,
          dto.cleanliness,
          dto.communication,
          dto.agreementCompliance,
        ]
      : [
          dto.behaviour,
          dto.communication,
          dto.propertyCondition,
          dto.honesty,
          dto.maintenance,
          dto.responseTime,
        ];
    if (
      !requiredRatings.every(
        (rating): rating is number =>
          typeof rating === 'number' &&
          Number.isInteger(rating) &&
          rating >= 1 &&
          rating <= 5,
      )
    ) {
      throw new BadRequestException(
        'Every review category must have a rating from 1 to 5',
      );
    }
    if (typeof dto.wouldRecommend !== 'boolean') {
      throw new BadRequestException('A recommendation choice is required');
    }

    const ratings = requiredRatings.filter(
      (value): value is number => typeof value === 'number',
    );
    const rating =
      Math.round(
        (ratings.reduce((sum, value) => sum + value, 0) / ratings.length) * 100,
      ) / 100;
    const reviewData = {
      userId,
      listingId: agreement.listingId,
      propertyId: agreement.propertyId,
      agreementId: agreement.id,
      landlordId: isTenantReview ? undefined : agreement.landlordId,
      tenantId: isTenantReview ? agreement.tenantId : undefined,
      reviewType: dto.reviewType,
      targetType: isTenantReview
        ? ReviewTargetType.TENANT
        : ReviewTargetType.HOST,
      rating,
      comment: dto.comment?.trim() || null,
      behaviour: dto.behaviour,
      communication: dto.communication,
      ...(isTenantReview
        ? {
            rentPayment: dto.rentPayment,
            propertyCare: dto.propertyCare,
            cleanliness: dto.cleanliness,
            agreementCompliance: dto.agreementCompliance,
          }
        : {
            propertyCondition: dto.propertyCondition,
            honesty: dto.honesty,
            maintenance: dto.maintenance,
            responseTime: dto.responseTime,
          }),
      wouldRecommend: dto.wouldRecommend,
    } satisfies Prisma.ReviewUncheckedCreateInput;

    let review: Prisma.ReviewGetPayload<{ include: typeof reviewInclude }>;
    try {
      review = await this.prisma.review.create({
        data: reviewData,
        include: reviewInclude,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'You have already reviewed this person for this agreement',
        );
      }
      throw error;
    }

    await this.trustScoreService.recalculateForUser(
      targetUserId,
      TrustSource.REVIEW,
      'Received a verified rental review',
    );
    return { ...review, verifiedRental: true };
  }

  async getEligibility(agreementId: string, userId: string) {
    await this.expireAgreementIfElapsed(agreementId);
    const agreement = await this.prisma.agreement.findUnique({
      where: { id: agreementId },
      select: {
        id: true,
        tenantId: true,
        landlordId: true,
        status: true,
        endDate: true,
        tenant: { select: { id: true, fullName: true } },
        landlord: { select: { id: true, fullName: true } },
      },
    });
    if (!agreement) throw new NotFoundException('Agreement not found');
    if (agreement.tenantId !== userId && agreement.landlordId !== userId) {
      throw new ForbiddenException('You cannot review this agreement');
    }

    const reviewType =
      userId === agreement.tenantId ? ReviewType.LANDLORD : ReviewType.TENANT;
    const completed = this.isAgreementCompleted(agreement);
    const existing = await this.prisma.review.findUnique({
      where: {
        agreementId_userId_reviewType: {
          agreementId,
          userId,
          reviewType,
        },
      },
      select: { id: true },
    });
    const target =
      userId === agreement.tenantId ? agreement.landlord : agreement.tenant;
    const selfReview = target.id === userId;
    return {
      agreementId,
      eligible: completed && !existing && !selfReview,
      alreadyReviewed: Boolean(existing),
      reviewType,
      target,
      reason: existing
        ? 'You have already reviewed this agreement'
        : selfReview
          ? 'You cannot review yourself'
          : completed
            ? null
            : 'Reviews are available after the rental agreement has ended',
    };
  }

  async getAgreementReviews(agreementId: string, userId: string) {
    const agreement = await this.prisma.agreement.findUnique({
      where: { id: agreementId },
      select: { id: true, tenantId: true, landlordId: true },
    });
    if (!agreement) throw new NotFoundException('Agreement not found');
    if (agreement.tenantId !== userId && agreement.landlordId !== userId) {
      throw new ForbiddenException(
        'You cannot access reviews for this agreement',
      );
    }
    const reviews = await this.prisma.review.findMany({
      where: { agreementId },
      orderBy: { createdAt: 'asc' },
      include: {
        ...reviewInclude,
        tenant: { select: publicReviewer },
        landlord: { select: publicReviewer },
      },
    });
    return reviews.map((review) => ({
      ...review,
      verifiedRental: true,
      target:
        review.reviewType === ReviewType.TENANT
          ? review.tenant
          : review.landlord,
    }));
  }

  async getMySubmittedReviews(userId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        ...reviewInclude,
        tenant: { select: publicReviewer },
        landlord: { select: publicReviewer },
      },
    });
    return reviews.map((review) => ({
      ...review,
      verifiedRental: Boolean(review.agreementId),
      target:
        review.reviewType === ReviewType.TENANT
          ? review.tenant
          : review.reviewType === ReviewType.LANDLORD
            ? review.landlord
            : null,
    }));
  }

  async getMyReceivedReviews(userId: string) {
    return this.getUserReviews(userId, new ReviewQueryDto());
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

  private async getCompletedAgreement(agreementId: string) {
    await this.expireAgreementIfElapsed(agreementId);
    const agreement = await this.prisma.agreement.findUnique({
      where: { id: agreementId },
      select: {
        id: true,
        tenantId: true,
        landlordId: true,
        listingId: true,
        propertyId: true,
        status: true,
        endDate: true,
      },
    });
    if (!agreement) throw new NotFoundException('Agreement not found');
    if (!this.isAgreementCompleted(agreement)) {
      throw new ForbiddenException(
        'Reviews are available only after the rental agreement has ended',
      );
    }
    return agreement;
  }

  private async expireAgreementIfElapsed(agreementId: string) {
    await this.prisma.agreement.updateMany({
      where: {
        id: agreementId,
        status: AgreementStatus.ACTIVE,
        endDate: { lte: new Date() },
      },
      data: { status: AgreementStatus.EXPIRED },
    });
  }

  private isAgreementCompleted(agreement: {
    status: AgreementStatus;
    endDate: Date | null;
  }) {
    return (
      (agreement.status === AgreementStatus.ENDED ||
        agreement.status === AgreementStatus.EXPIRED) &&
      agreement.endDate !== null &&
      agreement.endDate <= new Date()
    );
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
    return this.getUserReviews(user.id, query);
  }

  private async getUserReviews(userId: string, query: ReviewQueryDto) {
    const where: Prisma.ReviewWhereInput = {
      OR: [
        {
          landlordId: userId,
          reviewType: ReviewType.LANDLORD,
          agreementId: { not: null },
        },
        {
          tenantId: userId,
          reviewType: ReviewType.TENANT,
          agreementId: { not: null },
        },
      ],
    };
    const skip = (query.page - 1) * query.limit;
    const take = skip + query.limit;
    const [
      reviews,
      landlordStats,
      tenantStats,
      terminationReviews,
      terminationStats,
    ] = await Promise.all([
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        include: {
          ...reviewInclude,
          tenant: { select: publicReviewer },
          landlord: { select: publicReviewer },
        },
      }),
      this.prisma.review.aggregate({
        where: {
          landlordId: userId,
          reviewType: ReviewType.LANDLORD,
          agreementId: { not: null },
        },
        _count: { _all: true },
        _avg: {
          rating: true,
          behaviour: true,
          communication: true,
          propertyCondition: true,
          honesty: true,
          maintenance: true,
          responseTime: true,
        },
      }),
      this.prisma.review.aggregate({
        where: {
          tenantId: userId,
          reviewType: ReviewType.TENANT,
          agreementId: { not: null },
        },
        _count: { _all: true },
        _avg: {
          rating: true,
          behaviour: true,
          communication: true,
          rentPayment: true,
          propertyCare: true,
          cleanliness: true,
          agreementCompliance: true,
        },
      }),
      this.prisma.agreementTerminationReview.findMany({
        where: { targetUserId: userId },
        orderBy: { createdAt: 'desc' },
        take,
        include: {
          reviewer: { select: publicReviewer },
          agreement: {
            select: { id: true, listingId: true, propertyId: true },
          },
        },
      }),
      this.prisma.agreementTerminationReview.aggregate({
        where: { targetUserId: userId },
        _count: { _all: true },
        _avg: { rating: true },
      }),
    ]);
    const data = [
      ...reviews.map((review) => ({
        ...review,
        source: 'rental' as const,
        verifiedRental: Boolean(review.agreementId),
        target:
          review.reviewType === ReviewType.TENANT
            ? review.tenant
            : review.landlord,
      })),
      ...terminationReviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        reviewType: 'AGREEMENT' as const,
        agreementId: review.agreementId,
        user: review.reviewer,
        listing: null,
        property: null,
        source: 'agreement' as const,
        verifiedRental: true,
        target: null,
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(skip, skip + query.limit);
    const regularCount = landlordStats._count._all + tenantStats._count._all;
    const terminationCount = terminationStats._count._all;
    const totalCount = regularCount + terminationCount;
    const ratingTotal =
      (landlordStats._avg.rating ?? 0) * landlordStats._count._all +
      (tenantStats._avg.rating ?? 0) * tenantStats._count._all +
      (terminationStats._avg.rating ?? 0) * terminationCount;
    const averageRating = totalCount ? ratingTotal / totalCount : 0;
    return {
      data,
      totalCount,
      count: totalCount,
      averageRating,
      ratingSummary: {
        landlord: {
          averageRating: landlordStats._avg.rating ?? 0,
          count: landlordStats._count._all,
        },
        tenant: {
          averageRating: tenantStats._avg.rating ?? 0,
          count: tenantStats._count._all,
        },
        termination: {
          averageRating: terminationStats._avg.rating ?? 0,
          count: terminationCount,
        },
      },
      categoryAverages: {
        landlord: {
          behaviour: landlordStats._avg.behaviour,
          communication: landlordStats._avg.communication,
          propertyCondition: landlordStats._avg.propertyCondition,
          honesty: landlordStats._avg.honesty,
          maintenance: landlordStats._avg.maintenance,
          responseTime: landlordStats._avg.responseTime,
        },
        tenant: {
          behaviour: tenantStats._avg.behaviour,
          rentPayment: tenantStats._avg.rentPayment,
          propertyCare: tenantStats._avg.propertyCare,
          cleanliness: tenantStats._avg.cleanliness,
          communication: tenantStats._avg.communication,
          agreementCompliance: tenantStats._avg.agreementCompliance,
        },
      },
      pagination: {
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(totalCount / query.limit),
      },
    };
  }

  async delete(id: string, userId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      select: { id: true, userId: true, agreementId: true },
    });
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== userId) {
      throw new ForbiddenException('You cannot delete this review');
    }
    if (review.agreementId) {
      throw new ForbiddenException(
        'Verified rental reviews cannot be deleted after submission',
      );
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
    if (
      (agreement.status !== AgreementStatus.ENDED &&
        agreement.status !== AgreementStatus.EXPIRED) ||
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
