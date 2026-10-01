import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ListingAvailability } from '@prisma/client';

export class UpdateAvailabilityDto {
  @ApiProperty({ enum: ListingAvailability })
  @IsEnum(ListingAvailability)
  availability: ListingAvailability;
}
