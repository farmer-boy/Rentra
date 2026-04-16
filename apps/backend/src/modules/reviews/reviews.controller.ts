import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async createReview(
    @CurrentUser() user: JwtPayload,
    @Body() body: { listingId: string; rating: number; comment: string },
  ) {
    const review = await this.reviewsService.create(
      user.sub,
      body.listingId,
      body.rating,
      body.comment,
    );
    return {
      message: 'Review post ho gaya',
      data: review,
    };
  }

  @Get()
  async getAllReviews() {
    const reviews = await this.reviewsService.findAll();
    return {
      message: 'Tamam reviews',
      data: reviews,
      count: reviews.length,
    };
  }

  @Get(':id')
  async getReviewById(@Param('id') id: string) {
    const review = await this.reviewsService.findById(id);
    return {
      message: 'Review details',
      data: review,
    };
  }

  @Get('listing/:listingId')
  async getListingReviews(@Param('listingId') listingId: string) {
    const reviews = await this.reviewsService.getByListing(listingId);
    const avgRating = await this.reviewsService.getAverageRating(listingId);
    return {
      message: 'Listing ke reviews',
      data: reviews,
      averageRating: avgRating,
      count: reviews.length,
    };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async deleteReview(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.reviewsService.delete(id, user.sub);
    return {
      message: 'Review delete kar diya',
    };
  }
}
