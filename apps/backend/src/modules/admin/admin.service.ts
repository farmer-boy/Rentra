import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ListingPublicationStatus,
  ListingStatus,
  PaymentStatus,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ResoluteDisputeDto } from './dto/resolute-dispute.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers(filters?: { role?: string; status?: string; search?: string }) {
    const where: any = {};

    if (filters?.status) {
      where.isSuspended = filters.status === 'SUSPENDED';
    }

    if (filters?.role) {
      where.roles = { has: filters.role.toUpperCase() };
    }

    if (filters?.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        cnic: true,
        roles: true,
        trustScore: true,
        isVerified: true,
        isSuspended: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async suspendUser(userId: string, reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
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
  }

  async unsuspendUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
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
  }

  async verifyUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
      select: {
        id: true,
        email: true,
        fullName: true,
        isVerified: true,
        updatedAt: true,
      },
    });
  }

  async getAllLandlordProfiles() {
    return this.prisma.landlordProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            isSuspended: true,
            isVerified: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async verifyLandlordProfile(profileId: string) {
    const profile = await this.prisma.landlordProfile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      throw new NotFoundException('Landlord profile not found');
    }

    return this.prisma.landlordProfile.update({
      where: { id: profileId },
      data: { isVerified: true },
      include: {
        user: {
          select: { id: true, email: true, fullName: true, isSuspended: true },
        },
      },
    });
  }

  async getAllListings(filters?: { status?: string; city?: string }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.city) {
      where.city = filters.city;
    }

    return this.prisma.listing.findMany({
      where,
      include: {
        landlord: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async verifyListing(listingId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return this.prisma.listing.update({
      where: { id: listingId },
        data: {
          status: ListingStatus.PUBLISHED,
          publicationStatus: ListingPublicationStatus.PUBLISHED,
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
  }

  async flagListing(listingId: string, reason?: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return this.prisma.listing.update({
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
  }

  async getAllDisputes(filters?: { status?: string }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    return this.prisma.dispute.findMany({
      where,
      include: {
        agreement: {
          include: {
            tenant: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
            listing: {
              select: {
                id: true,
                title: true,
                city: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveDispute(disputeId: string, resolutionData: ResoluteDisputeDto) {
    const dispute = await this.prisma.dispute.findUnique({ where: { id: disputeId } });
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    return this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: 'RESOLVED',
        resolution: resolutionData.resolution,
      },
      include: {
        agreement: {
          include: {
            tenant: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
          },
        },
      },
    });
  }

  async closeDispute(disputeId: string) {
    const dispute = await this.prisma.dispute.findUnique({ where: { id: disputeId } });
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    return this.prisma.dispute.update({
      where: { id: disputeId },
      data: { status: 'CLOSED' },
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
      totalRevenue,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isSuspended: false } }),
      this.prisma.user.count({ where: { isSuspended: true } }),
      this.prisma.listing.count(),
      this.prisma.listing.count({ where: { status: ListingStatus.PUBLISHED } }),
      this.prisma.agreement.count(),
      this.prisma.agreement.count({ where: { status: 'ACTIVE' } }),
      this.prisma.dispute.count(),
      this.prisma.dispute.count({ where: { status: 'OPEN' } }),
      this.prisma.payment.aggregate({
        where: { status: PaymentStatus.PAID },
        _sum: { amount: true },
      }),
    ]);

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
      revenue: {
        total: totalRevenue._sum?.amount ?? 0,
      },
    };
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
          landlord: {
            select: {
              email: true,
            },
          },
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
              tenant: {
                select: {
                  email: true,
                },
              },
              listing: {
                select: {
                  title: true,
                },
              },
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
}
