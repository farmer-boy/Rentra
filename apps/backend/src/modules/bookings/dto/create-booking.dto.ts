import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ description: 'Property ID being booked.' })
  @IsString()
  propertyId!: string;

  @ApiProperty({ example: '2026-12-01', format: 'date-time' })
  @IsDateString()
  checkIn!: string;

  @ApiProperty({ example: '2026-12-05', format: 'date-time' })
  @IsDateString()
  checkOut!: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  guests!: number;

  @ApiPropertyOptional({
    description: 'Hotel room ID when booking a specific hotel room.',
  })
  @IsOptional()
  @IsString()
  hotelRoomId?: string;

  @ApiPropertyOptional({
    description:
      'Room type ID; one available room unit is allocated automatically.',
  })
  @IsOptional()
  @IsString()
  roomTypeId?: string;

  @ApiPropertyOptional({
    description: 'Hostel bed ID when booking a specific hostel bed.',
  })
  @IsOptional()
  @IsString()
  hostelBedId?: string;
}
