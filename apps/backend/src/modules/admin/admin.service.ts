import {
  BadRequestException,
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  AgreementStatus,
  BookingStatus,
  ListingPublicationStatus,
  ListingStatus,
  NotificationType,
  PaymentStatus,
  Prisma,
  PropertyType,
  PropertyStatus,
  Role,
  RentalRequestStatus,
  ReportStatus,
  DisputeStatus,
  ReviewType,
  VerificationKind,
  VerificationStatus,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AdminListQueryDto } from './dto/admin-list-query.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getAllUsers(query: AdminListQueryDto = new AdminListQueryDto()) {
    const where: Prisma.UserWhereInput = {
      ...(query.status && {
        isSuspended:
          this.enumFilter(query.status, ['ACTIVE', 'SUSPENDED']) ===
          'SUSPENDED',
      }),
      ...(query.role && { roles: { has: query.role } }),
      ...(query.verificationStatus && {
        verificationSubmissions: {
          some: {
            kind: VerificationKind.IDENTITY,
            status: this.enumFilter(query.verificationStatus, [
              VerificationStatus.UNVERIFIED,
              VerificationStatus.PENDING,
              VerificationStatus.APPROVED,
              VerificationStatus.REJECTED,
            ]),
          },
        },
      }),
      ...(query.search?.trim() && {
        OR: [
          { email: { contains: query.search.trim(), mode: 'insensitive' } },
          { fullName: { contains: query.search.trim(), mode: 'insensitive' } },
          { phone: { contains: query.search.trim(), mode: 'insensitive' } },
          { id: { contains: query.search.trim(), mode: 'insensitive' } },
        ],
      }),
      ...this.dateRange(query),
    };
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          roles: true,
          trustScore: true,
          emailVerifiedAt: true,
          phoneVerifiedAt: true,
          isSuspended: true,
          createdAt: true,
          updatedAt: true,
          verificationSubmissions: {
            where: { kind: VerificationKind.IDENTITY },
            orderBy: { submittedAt: 'desc' },
            take: 1,
            select: { status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);
    return this.pageResult(items, total, query);
  }

  async getUserDetails(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        roles: true,
        trustScore: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        isSuspended: true,
        createdAt: true,
        updatedAt: true,
        properties: {
          select: {
            id: true,
            title: true,
            status: true,
            verificationStatus: true,
            city: true,
            price: true,
          },
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
        listings: {
          select: {
            id: true,
            title: true,
            status: true,
            city: true,
            rent: true,
          },
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
        bookings: {
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            totalAmount: true,
          },
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
        rentalsAsTenant: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            listing: { select: { title: true } },
          },
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
        tenantAgreements: {
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            monthlyRent: true,
          },
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
        reviews: {
          select: { id: true, rating: true, reviewType: true, createdAt: true },
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
        verificationSubmissions: {
          select: {
            id: true,
            kind: true,
            status: true,
            submittedAt: true,
            reviewedAt: true,
          },
          take: 30,
          orderBy: { submittedAt: 'desc' },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    const [payments, reports] = await Promise.all([
      this.prisma.payment.findMany({
        where: { userId },
        select: {
          id: true,
          status: true,
          amount: true,
          currency: true,
          createdAt: true,
        },
        take: 20,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.report.findMany({
        where: { targetType: 'USER', targetId: userId },
        select: { id: true, status: true, reason: true, createdAt: true },
        take: 20,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { ...user, payments, reports };
  }

  async suspendUser(userId: string, actorId: string, reason: string) {
    if (!reason?.trim()) throw new BadRequestException('A reason is required');
    return this.prisma.$transaction(async (transaction) => {
      const user = await transaction.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');
      if (user.roles.includes(Role.ADMIN)) {
        throw new ConflictException(
          'Admin accounts cannot be suspended through user moderation',
        );
      }
      if (user.isSuspended) {
        throw new BadRequestException('User is already suspended');
      }
      const updated = await transaction.user.update({
        where: { id: userId },
        data: { isSuspended: true },
        select: {
          id: true,
          email: true,
          fullName: true,
          isSuspended: true,
          updatedAt: true,
        },
      });
      await this.audit.record(transaction, {
        actorId,
        actorRole: 'ADMIN',
        entityType: 'USER',
        entityId: userId,
        action: 'USER_SUSPENDED',
        reason: reason.trim(),
      });
      return updated;
    });
  }

  async unsuspendUser(userId: string, actorId: string, reason: string) {
    if (!reason?.trim()) throw new BadRequestException('A reason is required');
    return this.prisma.$transaction(async (transaction) => {
      const user = await transaction.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');
      if (!user.isSuspended) {
        throw new BadRequestException('User is not suspended');
      }
      const updated = await transaction.user.update({
        where: { id: userId },
        data: { isSuspended: false },
        select: {
          id: true,
          email: true,
          fullName: true,
          isSuspended: true,
          updatedAt: true,
        },
      });
      await this.audit.record(transaction, {
        actorId,
        actorRole: 'ADMIN',
        entityType: 'USER',
        entityId: userId,
        action: 'USER_REINSTATED',
        reason: reason.trim(),
      });
      return updated;
    });
  }

  async verifyUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    throw new ConflictException(
      'Review an identity or host verification submission instead',
    );
  }

  async getAllLandlordProfiles(
    query: AdminListQueryDto = new AdminListQueryDto(),
  ) {
    const where: Prisma.LandlordProfileWhereInput = {
      ...(query.search?.trim() && {
        OR: [
          {
            displayName: { contains: query.search.trim(), mode: 'insensitive' },
          },
          {
            user: {
              fullName: { contains: query.search.trim(), mode: 'insensitive' },
            },
          },
        ],
      }),
      ...this.dateRange(query),
    };
    const [items, total] = await Promise.all([
      this.prisma.landlordProfile.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true,
          displayName: true,
          isVerified: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              fullName: true,
              roles: true,
              isSuspended: true,
              emailVerifiedAt: true,
              phoneVerifiedAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.landlordProfile.count({ where }),
    ]);
    return this.pageResult(items, total, query);
  }

  async getProperties(query: AdminListQueryDto = new AdminListQueryDto()) {
    const where: Prisma.PropertyWhereInput = {
      ...(query.status && {
        status: this.enumFilter(query.status, Object.values(PropertyStatus)),
      }),
      ...(query.verificationStatus && {
        verificationStatus: this.enumFilter(
          query.verificationStatus,
          Object.values(VerificationStatus),
        ),
      }),
      ...(query.type && {
        propertyType: this.enumFilter(query.type, Object.values(PropertyType)),
      }),
      ...(query.search?.trim() && {
        OR: [
          { title: { contains: query.search.trim(), mode: 'insensitive' } },
          { city: { contains: query.search.trim(), mode: 'insensitive' } },
          { id: { contains: query.search.trim(), mode: 'insensitive' } },
        ],
      }),
      ...this.dateRange(query),
    };
    const [items, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true,
          title: true,
          propertyType: true,
          status: true,
          verificationStatus: true,
          city: true,
          price: true,
          createdAt: true,
          owner: { select: { id: true, fullName: true } },
          hotel: { select: { id: true, starRating: true } },
          hostel: { select: { id: true, genderPolicy: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.property.count({ where }),
    ]);
    return this.pageResult(items, total, query);
  }

  async getBookings(query: AdminListQueryDto = new AdminListQueryDto()) {
    const where: Prisma.BookingWhereInput = {
      ...(query.status && {
        status: this.enumFilter(query.status, Object.values(BookingStatus)),
      }),
      ...(query.search?.trim() && {
        OR: [
          { id: { contains: query.search.trim(), mode: 'insensitive' } },
          {
            tenant: {
              fullName: { contains: query.search.trim(), mode: 'insensitive' },
            },
          },
          {
            property: {
              title: { contains: query.search.trim(), mode: 'insensitive' },
            },
          },
          {
            listing: {
              title: { contains: query.search.trim(), mode: 'insensitive' },
            },
          },
        ],
      }),
      ...this.dateRange(query),
    };
    const [items, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true,
          status: true,
          startDate: true,
          endDate: true,
          totalAmount: true,
          currency: true,
          createdAt: true,
          tenant: { select: { id: true, fullName: true } },
          property: { select: { id: true, title: true } },
          listing: { select: { id: true, title: true } },
          payments: {
            select: { id: true, amount: true, currency: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.booking.count({ where }),
    ]);
    return this.pageResult(items, total, query);
  }

  async getRentalRequests(query: AdminListQueryDto = new AdminListQueryDto()) {
    const where: Prisma.RentalRequestWhereInput = {
      ...(query.status && {
        status: this.enumFilter(
          query.status,
          Object.values(RentalRequestStatus),
        ),
      }),
      ...(query.search?.trim() && {
        OR: [
          { id: { contains: query.search.trim(), mode: 'insensitive' } },
          {
            tenant: {
              fullName: { contains: query.search.trim(), mode: 'insensitive' },
            },
          },
          {
            landlord: {
              fullName: { contains: query.search.trim(), mode: 'insensitive' },
            },
          },
          {
            listing: {
              title: { contains: query.search.trim(), mode: 'insensitive' },
            },
          },
          {
            property: {
              title: { contains: query.search.trim(), mode: 'insensitive' },
            },
          },
        ],
      }),
      ...this.dateRange(query),
    };
    const [items, total] = await Promise.all([
      this.prisma.rentalRequest.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true,
          status: true,
          createdAt: true,
          tenant: { select: { id: true, fullName: true } },
          landlord: { select: { id: true, fullName: true } },
          listing: { select: { id: true, title: true } },
          property: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.rentalRequest.count({ where }),
    ]);
    return this.pageResult(items, total, query);
  }

  async getAgreements(query: AdminListQueryDto = new AdminListQueryDto()) {
    const where: Prisma.AgreementWhereInput = {
      ...(query.status && {
        status: this.enumFilter(query.status, Object.values(AgreementStatus)),
      }),
      ...(query.search?.trim() && {
        OR: [
          { id: { contains: query.search.trim(), mode: 'insensitive' } },
          {
            tenant: {
              fullName: { contains: query.search.trim(), mode: 'insensitive' },
            },
          },
          {
            landlord: {
              fullName: { contains: query.search.trim(), mode: 'insensitive' },
            },
          },
          {
            listing: {
              title: { contains: query.search.trim(), mode: 'insensitive' },
            },
          },
        ],
      }),
      ...this.dateRange(query),
    };
    const [items, total] = await Promise.all([
      this.prisma.agreement.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true,
          status: true,
          startDate: true,
          endDate: true,
          monthlyRent: true,
          createdAt: true,
          tenant: { select: { id: true, fullName: true } },
          landlord: { select: { id: true, fullName: true } },
          listing: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.agreement.count({ where }),
    ]);
    return this.pageResult(items, total, query);
  }

  async getPayments(query: AdminListQueryDto = new AdminListQueryDto()) {
    const where: Prisma.PaymentWhereInput = {
      ...(query.status && {
        status: this.enumFilter(query.status, Object.values(PaymentStatus)),
      }),
      ...(query.search?.trim() && {
        OR: [
          { id: { contains: query.search.trim(), mode: 'insensitive' } },
          {
            transactionId: {
              contains: query.search.trim(),
              mode: 'insensitive',
            },
          },
          {
            user: {
              fullName: { contains: query.search.trim(), mode: 'insensitive' },
            },
          },
        ],
      }),
      ...this.dateRange(query),
    };
    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true,
          amount: true,
          currency: true,
          provider: true,
          method: true,
          status: true,
          transactionId: true,
          paidAt: true,
          createdAt: true,
          user: { select: { id: true, fullName: true } },
          booking: { select: { id: true } },
          agreement: { select: { id: true } },
          rentalRequest: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);
    return this.pageResult(items, total, query);
  }

  async getReviews(query: AdminListQueryDto = new AdminListQueryDto()) {
    const where: Prisma.ReviewWhereInput = {
      ...(query.status && {
        reviewType: this.enumFilter(query.status, Object.values(ReviewType)),
      }),
      ...this.dateRange(query),
      ...(query.search?.trim() && {
        OR: [
          { comment: { contains: query.search.trim(), mode: 'insensitive' } },
          { id: { contains: query.search.trim(), mode: 'insensitive' } },
        ],
      }),
    };
    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true,
          reviewType: true,
          rating: true,
          comment: true,
          cleanliness: true,
          location: true,
          accuracy: true,
          communication: true,
          facilities: true,
          createdAt: true,
          user: { select: { id: true, fullName: true } },
          landlord: { select: { id: true, fullName: true } },
          property: { select: { id: true, title: true } },
          listing: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count({ where }),
    ]);
    return this.pageResult(items, total, query);
  }

  async getAuditEvents(query: AdminListQueryDto = new AdminListQueryDto()) {
    const where: Prisma.ModerationAuditEventWhereInput = {
      ...(query.type && { entityType: query.type }),
      ...(query.status && { action: query.status }),
      ...(query.search?.trim() && {
        OR: [
          { entityId: { contains: query.search.trim(), mode: 'insensitive' } },
          { action: { contains: query.search.trim(), mode: 'insensitive' } },
          { reason: { contains: query.search.trim(), mode: 'insensitive' } },
        ],
      }),
      ...this.dateRange(query),
    };
    const [items, total] = await Promise.all([
      this.prisma.moderationAuditEvent.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          actorId: true,
          actorRole: true,
          entityType: true,
          entityId: true,
          action: true,
          previousStatus: true,
          newStatus: true,
          reason: true,
          createdAt: true,
        },
      }),
      this.prisma.moderationAuditEvent.count({ where }),
    ]);
    return this.pageResult(items, total, query);
  }

  async getNotifications(query: AdminListQueryDto = new AdminListQueryDto()) {
    const where: Prisma.NotificationWhereInput = {
      ...(query.status && {
        isRead: this.enumFilter(query.status, ['READ', 'UNREAD']) === 'READ',
      }),
      ...(query.type && {
        type: this.enumFilter(query.type, Object.values(NotificationType)),
      }),
      ...(query.search?.trim() && {
        OR: [
          { title: { contains: query.search.trim(), mode: 'insensitive' } },
          { message: { contains: query.search.trim(), mode: 'insensitive' } },
          {
            user: {
              fullName: { contains: query.search.trim(), mode: 'insensitive' },
            },
          },
        ],
      }),
      ...this.dateRange(query),
    };
    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          isRead: true,
          createdAt: true,
          user: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);
    return this.pageResult(items, total, query);
  }

  async verifyLandlordProfile(profileId: string) {
    const profile = await this.prisma.landlordProfile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      throw new NotFoundException('Landlord profile not found');
    }

    throw new ConflictException(
      'Review a host verification submission instead',
    );
  }

  async getAllListings(query: AdminListQueryDto = new AdminListQueryDto()) {
    const where: Prisma.ListingWhereInput = {
      ...(query.status && {
        status: this.enumFilter(query.status, Object.values(ListingStatus)),
      }),
      ...(query.type && {
        type: this.enumFilter(query.type, Object.values(PropertyType)),
      }),
      ...(query.city?.trim() && {
        city: { contains: query.city.trim(), mode: 'insensitive' },
      }),
      ...(query.search?.trim() && {
        OR: [
          { title: { contains: query.search.trim(), mode: 'insensitive' } },
          { city: { contains: query.search.trim(), mode: 'insensitive' } },
          {
            landlord: {
              fullName: { contains: query.search.trim(), mode: 'insensitive' },
            },
          },
        ],
      }),
      ...(query.verificationStatus && {
        property: {
          verificationStatus: this.enumFilter(
            query.verificationStatus,
            Object.values(VerificationStatus),
          ),
        },
      }),
      ...this.dateRange(query),
    };
    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true,
          propertyId: true,
          title: true,
          type: true,
          status: true,
          publicationStatus: true,
          rent: true,
          city: true,
          createdAt: true,
          landlord: {
            select: { id: true, fullName: true },
          },
          property: { select: { verificationStatus: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.listing.count({ where }),
    ]);
    return this.pageResult(items, total, query);
  }

  async verifyListing(listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    throw new ConflictException(
      'Listing review cannot approve property verification; use the verification submission workflow',
    );
  }

  async flagListing(listingId: string, actorId: string, reason: string) {
    if (!reason?.trim()) throw new BadRequestException('A reason is required');
    return this.prisma.$transaction(async (transaction) => {
      const listing = await transaction.listing.findUnique({
        where: { id: listingId },
      });
      if (!listing) throw new NotFoundException('Listing not found');
      const updated = await transaction.listing.update({
        where: { id: listingId },
        data: {
          status: ListingStatus.UNPUBLISHED,
          publicationStatus: ListingPublicationStatus.UNPUBLISHED,
        },
        include: {
          landlord: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
      });
      await this.audit.record(transaction, {
        actorId,
        actorRole: 'ADMIN',
        entityType: 'LISTING',
        entityId: listingId,
        action: 'LISTING_REMOVED',
        reason: reason.trim(),
        metadata: {
          previousStatus: listing.status,
          previousPublicationStatus: listing.publicationStatus,
        },
      });
      return updated;
    });
  }

  async getDashboardStats() {
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalListings,
      verifiedListings,
      totalAgreements,
      activeAgreements,
      totalDisputes,
      openDisputes,
      totalBookings,
      completedBookings,
      totalRequests,
      openReports,
      pendingVerifications,
      paymentsByStatus,
      trends,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isSuspended: false } }),
      this.prisma.user.count({ where: { isSuspended: true } }),
      this.prisma.listing.count(),
      this.prisma.listing.count({ where: { status: ListingStatus.PUBLISHED } }),
      this.prisma.agreement.count(),
      this.prisma.agreement.count({ where: { status: 'ACTIVE' } }),
      this.prisma.dispute.count(),
      this.prisma.dispute.count({ where: { status: DisputeStatus.OPEN } }),
      this.prisma.booking.count(),
      this.prisma.booking.count({ where: { status: BookingStatus.COMPLETED } }),
      this.prisma.rentalRequest.count(),
      this.prisma.report.count({ where: { status: ReportStatus.OPEN } }),
      this.prisma.verificationSubmission.count({
        where: { status: VerificationStatus.PENDING },
      }),
      this.prisma.payment.groupBy({
        by: ['status', 'currency'],
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.getMonthlyTrends(),
    ]);

    const paymentTotals = paymentsByStatus.reduce<
      Record<string, Record<string, { count: number; grossAmount: number }>>
    >((result, row) => {
      const statusBucket = result[row.status] ?? {};
      const bucket = statusBucket[row.currency] ?? { count: 0, grossAmount: 0 };
      bucket.count += row._count._all;
      bucket.grossAmount += row._sum.amount ?? 0;
      statusBucket[row.currency] = bucket;
      result[row.status] = statusBucket;
      return result;
    }, {});
    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        suspended: suspendedUsers,
      },
      listings: {
        total: totalListings,
        verified: verifiedListings,
      },
      agreements: {
        total: totalAgreements,
        active: activeAgreements,
      },
      disputes: {
        total: totalDisputes,
        open: openDisputes,
      },
      bookings: { total: totalBookings, completed: completedBookings },
      rentalRequests: { total: totalRequests },
      reports: { open: openReports },
      verifications: { pending: pendingVerifications },
      payments: {
        byStatus: paymentTotals,
        note: 'Payment amounts are gross transaction volume, not platform revenue.',
      },
      trends,
    };
  }

  private async getMonthlyTrends() {
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCMonth(start.getUTCMonth() - 5);
    const [users, properties, bookings, payments] = await Promise.all([
      this.prisma.$queryRaw<Array<{ month: string; count: number }>>(Prisma.sql`
        SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS month,
               COUNT(*)::int AS count
        FROM "User" WHERE "createdAt" >= ${start}
        GROUP BY 1 ORDER BY 1
      `),
      this.prisma.$queryRaw<Array<{ month: string; count: number }>>(Prisma.sql`
        SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS month,
               COUNT(*)::int AS count
        FROM "Property" WHERE "createdAt" >= ${start}
        GROUP BY 1 ORDER BY 1
      `),
      this.prisma.$queryRaw<Array<{ month: string; count: number }>>(Prisma.sql`
        SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS month,
               COUNT(*)::int AS count
        FROM "Booking" WHERE "createdAt" >= ${start}
        GROUP BY 1 ORDER BY 1
      `),
      this.prisma.$queryRaw<
        Array<{ month: string; amount: number; currency: string }>
      >(Prisma.sql`
        SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS month,
               COALESCE(SUM(amount), 0)::int AS amount, currency
        FROM "Payment"
        WHERE "createdAt" >= ${start} AND status IN ('SUCCESS', 'PAID')
        GROUP BY 1, currency ORDER BY 1
      `),
    ]);
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(start);
      date.setUTCMonth(start.getUTCMonth() + index);
      return date.toISOString().slice(0, 7);
    });
    return months.map((month) => ({
      month,
      newUsers: users.find((entry) => entry.month === month)?.count ?? 0,
      properties: properties.find((entry) => entry.month === month)?.count ?? 0,
      bookings: bookings.find((entry) => entry.month === month)?.count ?? 0,
      grossPayments: payments
        .filter((entry) => entry.month === month)
        .map(({ amount, currency }) => ({ amount, currency })),
    }));
  }

  async getRecentActivity() {
    const [recentUsers, recentListings, recentDisputes] = await Promise.all([
      this.prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          createdAt: true,
        },
      }),
      this.prisma.listing.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          city: true,
          createdAt: true,
          landlord: { select: { fullName: true } },
        },
      }),
      this.prisma.dispute.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          createdAt: true,
          agreement: {
            select: {
              tenant: { select: { fullName: true } },
              listing: { select: { title: true } },
            },
          },
        },
      }),
    ]);

    return {
      recentUsers,
      recentListings,
      recentDisputes,
    };
  }

  private enumFilter<T extends string>(
    value: string,
    allowed: readonly T[],
  ): T {
    const normalized = value.toUpperCase();
    const match = allowed.find((item) => item === normalized);
    if (!match) {
      throw new BadRequestException(`Unsupported filter value: ${value}`);
    }
    return match;
  }

  private dateRange(query: AdminListQueryDto): {
    createdAt?: Prisma.DateTimeFilter;
  } {
    if (!query.from && !query.to) return {};
    return {
      createdAt: {
        ...(query.from && { gte: new Date(query.from) }),
        ...(query.to && { lte: new Date(query.to) }),
      },
    };
  }

  private pageResult<T>(items: T[], total: number, query: AdminListQueryDto) {
    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }
}
