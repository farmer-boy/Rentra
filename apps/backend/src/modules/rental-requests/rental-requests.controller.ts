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
import type { JwtPayload } from '../../common/types/jwt-payload';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateRentalRequestDto } from './dto/create-rental-request.dto';
import { RentalRequestsService } from './rental-requests.service';

@ApiTags('rental-requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class RentalRequestsController {
  constructor(private readonly rentalRequestsService: RentalRequestsService) {}

  @Post('properties/:id/rental-requests')
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
  @ApiOperation({
    summary: 'List rental requests created by the current tenant',
  })
  my(@CurrentUser() user: JwtPayload) {
    return this.rentalRequestsService.myRequests(user.sub);
  }

  @Get('rental-requests/received')
  @ApiOperation({
    summary: 'List rental requests received by the current owner',
  })
  received(@CurrentUser() user: JwtPayload) {
    return this.rentalRequestsService.receivedRequests(user.sub);
  }

  @Patch('rental-requests/:id/accept')
  @ApiOperation({
    summary: 'Owner accepts a pending request and creates an agreement',
  })
  accept(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.rentalRequestsService.accept(id, user.sub);
  }

  @Patch('rental-requests/:id/reject')
  @ApiOperation({ summary: 'Owner rejects a pending request' })
  reject(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.rentalRequestsService.reject(id, user.sub);
  }

  @Patch('rental-requests/:id/cancel')
  @ApiOperation({ summary: 'Tenant cancels a pending request' })
  cancel(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.rentalRequestsService.cancel(id, user.sub);
  }
}
