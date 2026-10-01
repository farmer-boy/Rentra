import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
  Param,
  Body,
  UseGuards,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ListingAvailability } from '@prisma/client';
import { ListingsService } from './listings.service';
import { AmenitiesDto } from './dto/amenities.dto';
import { CreateListingDto } from './dto/create-listing.dto';
import { ListingQueryDto } from './dto/listing-query.dto';
import { PropertyImageDto } from './dto/property-image.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { UploadService } from './upload.service';

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(
    private readonly listingsService: ListingsService,
    private readonly uploadService: UploadService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async createListing(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateListingDto,
  ) {
    const listing = await this.listingsService.create(user.sub, dto);
    return {
      message: 'Listing published successfully',
      data: listing,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Search and filter published properties' })
  @ApiResponse({ status: 200, description: 'Paginated property results' })
  async getAllListings(@Query() query: ListingQueryDto) {
    const listings = await this.listingsService.findAll(query);
    return {
      message: 'All listings',
      data: listings.items,
      pagination: listings.pagination,
    };
  }

  @Get('landlord/my-listings')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get the current landlord properties' })
  async getMyListings(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListingQueryDto,
  ) {
    const listings = await this.listingsService.getByLandlord(user.sub, query);
    return { message: 'Your listings', data: listings.items, pagination: listings.pagination };
  }

  @Get('landlord/analytics')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get landlord property analytics' })
  async getLandlordAnalytics(@CurrentUser() user: JwtPayload) {
    return this.listingsService.getLandlordAnalytics(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'View a property' })
  async getListingById(@Param('id') id: string) {
    const listing = await this.listingsService.findById(id);
    return {
      message: 'Listing details',
      data: listing,
    };
  }

  @Post(':id/view')
  @ApiOperation({ summary: 'Record a property view' })
  async recordPropertyView(@Param('id') id: string, @Body('sessionId') sessionId?: string) {
    return this.listingsService.recordView(id, sessionId);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async updateListing(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateListingDto,
  ) {
    const listing = await this.listingsService.update(id, user.sub, dto);
    return {
      message: 'Listing updated successfully',
      data: listing,
    };
  }

  @Patch(':id/publish')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Publish a property owned by the current landlord' })
  async publishListing(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return {
      message: 'Listing published successfully',
      data: await this.listingsService.publish(id, user.sub),
    };
  }

  @Patch(':id/unpublish')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Unpublish a property owned by the current landlord' })
  async unpublishListing(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return {
      message: 'Listing unpublished successfully',
      data: await this.listingsService.unpublish(id, user.sub),
    };
  }

  @Patch(':id/availability')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mark a property available or rented' })
  async updateAvailability(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return {
      message: 'Listing availability updated successfully',
      data: await this.listingsService.setAvailability(id, user.sub, dto.availability),
    };
  }

  @Post(':id/images')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add an image URL to an owned property' })
  async addImage(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: PropertyImageDto,
  ) {
    return { message: 'Property image added successfully', data: await this.listingsService.addImage(id, user.sub, dto) };
  }

  @Post(':id/images/upload')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Upload an image for an owned property' })
  async uploadImage(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: any,
    @Body('altText') altText?: string,
    @Body('sortOrder') sortOrder?: string,
  ) {
    const uploaded = await this.uploadService.uploadToCloudinary(file);
    const image = await this.listingsService.addImage(id, user.sub, {
      url: uploaded.secureUrl,
      publicId: uploaded.publicId,
      altText,
      sortOrder: sortOrder ? Number(sortOrder) : undefined,
    });
    return { message: 'Property image uploaded successfully', data: image };
  }

  @Delete(':id/images/:imageId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove an image from an owned property' })
  async removeImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.listingsService.removeImage(id, imageId, user.sub);
    return { message: 'Property image removed successfully' };
  }

  @Put(':id/amenities')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Replace amenities for an owned property' })
  async setAmenities(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: AmenitiesDto,
  ) {
    return { message: 'Property amenities updated successfully', data: await this.listingsService.setAmenities(id, user.sub, dto) };
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
      message: 'Listing deleted successfully',
    };
  }
}
