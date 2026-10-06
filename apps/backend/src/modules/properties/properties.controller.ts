import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
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
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePropertyDto } from './dto/create-property.dto';
import { AssignPropertyManagerDto } from './dto/assign-property-manager.dto';
import { PropertyQueryDto } from './dto/property-query.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { UpdatePropertyStatusDto } from './dto/update-property-status.dto';
import { UpdatePropertyImageDto } from './dto/update-property-image.dto';
import { SetPropertyAmenitiesDto } from './dto/set-property-amenities.dto';
import { PropertySearchDto } from './dto/property-search.dto';
import { PropertyStatsQueryDto } from './dto/property-stats-query.dto';
import { PropertyViewDto } from './dto/property-view.dto';
import { NearbyPropertiesDto } from './dto/nearby-properties.dto';
import {
  AvailabilityRangeDto,
  BlockAvailabilityDto,
} from './dto/availability-range.dto';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';
import { PropertiesService } from './properties.service';
import { AvailabilityService } from './availability.service';
import { RoomTypesService } from './room-types.service';
import { ImageUploadFile } from '../listings/upload.service';

@ApiTags('properties')
@Controller('properties')
export class PropertiesController {
  constructor(
    private readonly propertiesService: PropertiesService,
    private readonly availabilityService: AvailabilityService,
    private readonly roomTypesService: RoomTypesService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a property and its linked marketplace listing',
  })
  @ApiResponse({
    status: 201,
    description: 'Property created in PENDING_VERIFICATION status',
  })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(user.sub, dto);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary:
      'List active properties, plus the caller’s own/managed properties when authenticated',
  })
  findAll(@Query() query: PropertyQueryDto, @CurrentUser() user?: JwtPayload) {
    return this.propertiesService.findAll(query, user?.sub);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search active properties with filters, radius, and sorting',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated active property results',
  })
  search(@Query() query: PropertySearchDto) {
    return this.propertiesService.search(query);
  }

  @Get('nearby')
  @ApiOperation({
    summary: 'Find active properties around map coordinates',
  })
  @ApiResponse({
    status: 200,
    description:
      'Nearby active properties with map markers, price, type, and distance',
  })
  findNearby(@Query() query: NearbyPropertiesDto) {
    return this.propertiesService.findNearby(query);
  }

  @Post(':id/room-types')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a hotel or guest-house room type and its units',
  })
  createRoomType(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateRoomTypeDto,
  ) {
    return this.roomTypesService.create(id, user.sub, dto);
  }

  @Get(':id/room-types')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'List room types and units for a property' })
  getRoomTypes(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    return this.roomTypesService.list(id, user?.sub ?? '');
  }

  @Get(':id/availability')
  @ApiOperation({
    summary: 'Get daily availability, blocked, maintenance, and booked dates',
  })
  getAvailability(
    @Param('id') id: string,
    @Query() query: AvailabilityRangeDto,
  ) {
    return this.availabilityService.getPropertyAvailability(id, query);
  }

  @Post(':id/availability/block')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Block or mark maintenance dates for a property' })
  blockAvailability(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: BlockAvailabilityDto,
  ) {
    return this.availabilityService.block(id, user.sub, dto);
  }

  @Delete(':id/availability/block')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Remove blocked or maintenance dates for a property',
  })
  unblockAvailability(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() range: AvailabilityRangeDto,
  ) {
    return this.availabilityService.unblock(id, user.sub, range);
  }

  @Post(':id/view')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Record an authenticated or anonymous property view',
  })
  @ApiResponse({ status: 200, description: 'View tracked or deduplicated' })
  recordView(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload | undefined,
    @Body() dto: PropertyViewDto | undefined,
    @Req() request: Request,
  ) {
    return this.propertiesService.recordView(
      id,
      user?.sub,
      dto?.sessionId,
      request.ip,
      request.get('user-agent'),
    );
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get owner/manager property performance stats' })
  getStats(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Query() query: PropertyStatsQueryDto,
  ) {
    return this.propertiesService.getStats(id, user.sub, query);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary:
      'Get an active property, or an owned/managed property for its authorized user',
  })
  findById(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    return this.propertiesService.findById(id, user?.sub);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a property owned by or assigned to the caller',
  })
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(id, user.sub, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Expire and unpublish a property owned by or assigned to the caller',
  })
  @ApiResponse({
    status: 200,
    description: 'Property soft-deleted with EXPIRED status',
  })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.propertiesService.remove(id, user.sub);
  }

  @Post(':id/images')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('files', 12, {
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
        altText: { type: 'string' },
      },
      required: ['files'],
    },
  })
  @ApiOperation({ summary: 'Upload up to 12 property images to Cloudinary' })
  addImages(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @UploadedFiles() files: ImageUploadFile[],
    @Body('altText') altText?: string,
  ) {
    return this.propertiesService.addImages(id, user.sub, files ?? [], altText);
  }

  @Patch(':id/images/:imageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reorder an image, set it primary, or update alt text',
  })
  updateImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdatePropertyImageDto,
  ) {
    return this.propertiesService.updateImage(id, imageId, user.sub, dto);
  }

  @Delete(':id/images/:imageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a property image from Cloudinary and the database',
  })
  deleteImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.propertiesService.deleteImage(id, imageId, user.sub);
  }

  @Post(':id/amenities')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add catalog amenities to a property' })
  addAmenities(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: SetPropertyAmenitiesDto,
  ) {
    return this.propertiesService.addAmenities(id, user.sub, dto.amenityIds);
  }

  @Delete(':id/amenities/:amenityId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a catalog amenity from a property' })
  deleteAmenity(
    @Param('id') id: string,
    @Param('amenityId') amenityId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.propertiesService.deleteAmenity(id, amenityId, user.sub);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin changes verification or lifecycle status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdatePropertyStatusDto) {
    return this.propertiesService.updateStatus(id, dto.status);
  }

  @Post(':id/managers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Owner assigns an eligible user as property manager',
  })
  assignManager(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: AssignPropertyManagerDto,
  ) {
    return this.propertiesService.assignManager(id, user.sub, dto.userId);
  }

  @Delete(':id/managers/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Owner revokes a property manager assignment' })
  revokeManager(
    @Param('id') id: string,
    @Param('userId') managerId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.propertiesService.revokeManager(id, user.sub, managerId);
  }
}
