import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        property: {
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
            owner: { select: { id: true, fullName: true, trustScore: true } },
            location: true,
          },
        },
        listing: {
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
            landlord: {
              select: { id: true, fullName: true, trustScore: true },
            },
          },
        },
      },
    });
    return favorites.map((favorite) => ({
      ...(favorite.property ?? favorite.listing),
      targetType: favorite.property ? 'PROPERTY' : 'LISTING',
      savedAt: favorite.createdAt,
    }));
  }

  async add(userId: string, targetId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: targetId, status: 'ACTIVE' },
      select: { id: true },
    });
    if (property) {
      return this.prisma.favorite.upsert({
        where: { userId_propertyId: { userId, propertyId: targetId } },
        create: { userId, propertyId: targetId },
        update: {},
      });
    }

    const listing = await this.prisma.listing.findUnique({
      where: { id: targetId },
    });
    if (!listing) throw new NotFoundException('Property or listing not found');
    const listingId = targetId;
    return this.prisma.favorite.upsert({
      where: { userId_listingId: { userId, listingId } },
      create: { userId, listingId },
      update: {},
    });
  }

  async remove(userId: string, targetId: string) {
    await this.prisma.favorite.deleteMany({
      where: {
        userId,
        OR: [{ propertyId: targetId }, { listingId: targetId }],
      },
    });
    return { saved: false };
  }

  async has(userId: string, targetId: string) {
    const favorite = await this.prisma.favorite.findFirst({
      where: {
        userId,
        OR: [{ propertyId: targetId }, { listingId: targetId }],
      },
      select: { id: true },
    });
    return { saved: Boolean(favorite) };
  }
}
