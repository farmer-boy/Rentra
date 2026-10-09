import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateRentalRequestDto {
  @ApiPropertyOptional({ example: '2026-11-01', format: 'date' })
  @IsOptional()
  @IsDateString()
  moveInDate?: string;

  @ApiPropertyOptional({
    example: 12,
    minimum: 1,
    description: 'Requested rental duration in months.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  duration?: number;

  @ApiPropertyOptional({ example: 3, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  occupants = 1;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}
