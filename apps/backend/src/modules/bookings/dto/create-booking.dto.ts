import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ description: 'Property ID being booked.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  propertyId!: string;

  @ApiProperty({ example: '2026-12-01', format: 'date' })
  @IsDateString({ strict: true })
  checkIn!: string;

  @ApiProperty({ example: '2026-12-05', format: 'date' })
  @IsDateString({ strict: true })
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
  @IsNotEmpty()
  @MaxLength(128)
  hotelRoomId?: string;

  @ApiPropertyOptional({
    description:
      'Room type ID; one available room unit is allocated automatically.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  roomTypeId?: string;

  @ApiPropertyOptional({
    description: 'Hostel bed ID when booking a specific hostel bed.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  hostelBedId?: string;
}
