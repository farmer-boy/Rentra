import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class AvailabilityRangeDto {
  @ApiProperty({
    example: '2026-12-01',
    format: 'date',
    description: 'Inclusive start date in YYYY-MM-DD format.',
  })
  @IsDateString({ strict: true })
  startDate!: string;

  @ApiProperty({
    example: '2026-12-05',
    format: 'date',
    description: 'Exclusive end date in YYYY-MM-DD format.',
  })
  @IsDateString({ strict: true })
  endDate!: string;

  @ApiPropertyOptional({
    description:
      'Optionally scope availability to one hotel room, hostel room, or hostel bed.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  hotelRoomId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  hostelRoomId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  hostelBedId?: string;
}

export class BlockAvailabilityDto extends AvailabilityRangeDto {
  @ApiProperty({
    enum: ['BLOCKED', 'MAINTENANCE'],
  })
  @IsEnum({ BLOCKED: 'BLOCKED', MAINTENANCE: 'MAINTENANCE' })
  status!: 'BLOCKED' | 'MAINTENANCE';

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
