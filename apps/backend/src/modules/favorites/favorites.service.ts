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
        listing: {
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
            landlord: { select: { id: true, fullName: true, trustScore: true } },
          },
        },
      },
    });
    return favorites.map((favorite) => ({ ...favorite.listing, savedAt: favorite.createdAt }));
  }

  async add(userId: string, listingId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('Listing not found');
    return this.prisma.favorite.upsert({
      where: { userId_listingId: { userId, listingId } },
      create: { userId, listingId },
      update: {},
    });
  }

  async remove(userId: string, listingId: string) {
    await this.prisma.favorite.deleteMany({ where: { userId, listingId } });
    return { saved: false };
  }

  async has(userId: string, listingId: string) {
    const favorite = await this.prisma.favorite.findUnique({ where: { userId_listingId: { userId, listingId } } });
    return { saved: Boolean(favorite) };
  }
}
