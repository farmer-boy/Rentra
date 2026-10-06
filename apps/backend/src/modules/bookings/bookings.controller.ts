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
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingsService } from './bookings.service';

@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('bookings')
  @ApiOperation({
    summary:
      'Create a short-stay booking request with availability and price checks',
  })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(user.sub, dto.propertyId, dto);
  }

  @Get('bookings/my')
  @ApiOperation({ summary: 'List bookings belonging to the current tenant' })
  my(@CurrentUser() user: JwtPayload) {
    return this.bookingsService.myBookings(user.sub);
  }

  @Get('bookings/:id')
  @ApiOperation({
    summary: 'Get a booking as tenant, owner, or assigned manager',
  })
  getById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.bookingsService.findById(id, user.sub);
  }

  @Patch('bookings/:id/cancel')
  @ApiOperation({ summary: 'Cancel a pending or confirmed booking' })
  cancel(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.bookingsService.cancel(id, user.sub);
  }

  @Get('properties/:id/bookings')
  @ApiOperation({ summary: 'List bookings for a property as owner or manager' })
  propertyBookings(
    @Param('id') propertyId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.bookingsService.propertyBookings(propertyId, user.sub);
  }
}
