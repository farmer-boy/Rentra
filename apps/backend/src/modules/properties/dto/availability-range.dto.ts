import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class AvailabilityRangeDto {
  @ApiProperty({ example: '2026-12-01', format: 'date' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2026-12-05', format: 'date' })
  @IsDateString()
  endDate!: string;
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
