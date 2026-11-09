import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PropertyType, RentalDuration } from '@prisma/client';

export class RentEstimateDto {
  @ApiProperty({ example: 'Lahore' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city: string;

  @ApiPropertyOptional({ example: 'Gulberg' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  area?: string;

  @ApiPropertyOptional({ enum: PropertyType })
  @IsOptional()
  @IsEnum(PropertyType)
  propertyType?: PropertyType;

  @ApiPropertyOptional({ minimum: 0, maximum: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(30)
  bedrooms?: number;

  @ApiPropertyOptional({ minimum: 50, maximum: 100000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(50)
  @Max(100000)
  sqft?: number;

  @ApiPropertyOptional({ enum: RentalDuration, default: RentalDuration.MONTHLY })
  @IsOptional()
  @IsEnum(RentalDuration)
  rentalDuration?: RentalDuration;
}
