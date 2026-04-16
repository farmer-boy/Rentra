import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    listingId: string,
    rating: number,
    comment: string,
  ) {
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating 1 se 5 ke beech hona chahiye');
    }

    return await this.prisma.review.create({
      data: {
        userId,
        listingId,
        rating,
        comment,
      },
    });
  }

  async findAll() {
    return await this.prisma.review.findMany({
      include: {
        user: { select: { id: true, fullName: true } },
      },
    });
  }

  async findById(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!review) throw new BadRequestException('Review nahi mila');
    return review;
  }

  async getByListing(listingId: string) {
    return await this.prisma.review.findMany({
      where: { listingId },
      include: {
        user: { select: { id: true, fullName: true } },
      },
    });
  }

  async getAverageRating(listingId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { listingId },
    });

    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return (total / reviews.length).toFixed(2);
  }

  async delete(id: string, userId: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review || review.userId !== userId) {
      throw new BadRequestException('Review delete nahi kar sakte');
    }

    return await this.prisma.review.delete({ where: { id } });
  }
}
