import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('reviews')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async createReview(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateReviewDto,
  ) {
    const review = await this.reviewsService.create(user.sub, dto);
    return { message: 'Review posted successfully', data: review };
  }

  @Get('reviews')
  async getAllReviews() {
    const reviews = await this.reviewsService.findAll();
    return { message: 'All reviews', data: reviews, count: reviews.length };
  }

  @Get('reviews/listing/:listingId')
  async getListingReviews(@Param('listingId') listingId: string) {
    const [reviews, averageRating] = await Promise.all([
      this.reviewsService.getByListing(listingId),
      this.reviewsService.getAverageRating(listingId),
    ]);
    return {
      message: 'Listing reviews',
      data: reviews,
      averageRating,
      count: reviews.length,
    };
  }

  @Get('reviews/:id')
  async getReviewById(@Param('id') id: string) {
    return {
      message: 'Review details',
      data: await this.reviewsService.findById(id),
    };
  }

  @Delete('reviews/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async deleteReview(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.reviewsService.delete(id, user.sub);
    return { message: 'Review deleted successfully' };
  }

  @Get('properties/:id/reviews')
  async getPropertyReviews(
    @Param('id') id: string,
    @Query() query: ReviewQueryDto,
  ) {
    return this.reviewsService.getPropertyReviews(id, query);
  }

  @Get('users/:id/reviews')
  async getLandlordReviews(
    @Param('id') id: string,
    @Query() query: ReviewQueryDto,
  ) {
    return this.reviewsService.getLandlordReviews(id, query);
  }
}
