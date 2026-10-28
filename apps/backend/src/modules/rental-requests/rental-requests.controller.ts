import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AcceptRentalRequestDto } from './dto/accept-rental-request.dto';
import { CreateRentalRequestDto } from './dto/create-rental-request.dto';
import { RejectRentalRequestDto } from './dto/reject-rental-request.dto';
import { RequestInformationDto } from './dto/request-information.dto';
import { RentalRequestsService } from './rental-requests.service';

@ApiTags('rental-requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class RentalRequestsController {
  constructor(private readonly rentalRequestsService: RentalRequestsService) {}

  @Post('properties/:id/rental-requests')
  @Roles('TENANT')
  @ApiOperation({
    summary: 'Tenant sends a rental request for an active property',
  })
  create(
    @Param('id') propertyId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateRentalRequestDto,
  ) {
    return this.rentalRequestsService.create(user.sub, propertyId, dto);
  }

  @Get('rental-requests/my')
  @Roles('TENANT')
  @ApiOperation({
    summary: 'List rental requests created by the current tenant',
  })
  my(@CurrentUser() user: JwtPayload) {
    return this.rentalRequestsService.myRequests(user.sub);
  }

  @Get('rental-requests/received')
  @Roles('LANDLORD')
  @ApiOperation({
    summary: 'List rental requests received by the current owner',
  })
  received(@CurrentUser() user: JwtPayload) {
    return this.rentalRequestsService.receivedRequests(user.sub);
  }

  @Get('rental-requests/:id/review-profile')
  @Roles('LANDLORD')
  @ApiOperation({ summary: 'Get minimized tenant review information for an owned request' })
  reviewProfile(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.rentalRequestsService.getTenantReviewProfile(id, user.sub);
  }

  @Patch('rental-requests/:id/accept')
  @Roles('LANDLORD')
  @ApiOperation({
    summary:
      'Owner accepts a pending request and creates an active agreement with optional final terms',
  })
  accept(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: AcceptRentalRequestDto,
  ) {
    return this.rentalRequestsService.accept(id, user.sub, dto);
  }

  @Patch('rental-requests/:id/reject')
  @Roles('LANDLORD')
  @ApiOperation({ summary: 'Owner rejects a pending request' })
  reject(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() dto: RejectRentalRequestDto = new RejectRentalRequestDto()) {
    return this.rentalRequestsService.reject(id, user.sub, dto?.reason);
  }

  @Post('rental-requests/:id/request-information')
  @Roles('LANDLORD')
  @ApiOperation({ summary: 'Ask the tenant for relevant additional rental information' })
  requestInformation(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() dto: RequestInformationDto) {
    return this.rentalRequestsService.requestInformation(id, user.sub, dto.message);
  }

  @Post('rental-requests/:id/respond-information')
  @Roles('TENANT')
  @ApiOperation({ summary: 'Tenant replies to a landlord information request' })
  respondToInformation(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() dto: RequestInformationDto) {
    return this.rentalRequestsService.respondToInformation(id, user.sub, dto.message);
  }

  @Patch('rental-requests/:id/cancel')
  @Roles('TENANT')
  @ApiOperation({ summary: 'Tenant cancels a pending request' })
  cancel(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.rentalRequestsService.cancel(id, user.sub);
  }
}
