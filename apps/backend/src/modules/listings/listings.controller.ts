import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload';

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async createListing(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateListingDto,
  ) {
    const listing = await this.listingsService.create(user.sub, dto);
    return {
      message: 'Listing publish ho gaya',
      data: listing,
    };
  }

  @Get()
  async getAllListings(
    @Query('city') city?: string,
    @Query('type') type?: string,
  ) {
    const listings = await this.listingsService.findAll({
      city,
      propertyType: type,
    });
    return {
      message: 'Tamam listings',
      data: listings,
      count: listings.length,
    };
  }

  @Get(':id')
  async getListingById(@Param('id') id: string) {
    const listing = await this.listingsService.findById(id);
    return {
      message: 'Listing details',
      data: listing,
    };
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async updateListing(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: Partial<CreateListingDto>,
  ) {
    const listing = await this.listingsService.update(id, user.sub, dto);
    return {
      message: 'Listing update ho gaya',
      data: listing,
    };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async deleteListing(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.listingsService.delete(id, user.sub);
    return {
      message: 'Listing delete ho gaya',
    };
  }

  @Get('landlord/my-listings')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getMyListings(@CurrentUser() user: JwtPayload) {
    const listings = await this.listingsService.getByLandlord(user.sub);
    return {
      message: 'Aapki listings',
      data: listings,
      count: listings.length,
    };
  }
}
