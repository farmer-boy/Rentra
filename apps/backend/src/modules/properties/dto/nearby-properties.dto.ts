import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  FurnishedStatus,
  ListingAvailability,
  PropertyType,
  RentalDuration,
} from '@prisma/client';

function parseAmenities(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter(
      (item: unknown): item is string => typeof item === 'string',
    );
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return value;
}

export class NearbyPropertiesDto {
  @ApiProperty({ example: 31.4697 })
  @Type(() => Number)
  @IsLatitude()
  latitude!: number;

  @ApiProperty({ example: 74.2728 })
  @Type(() => Number)
  @IsLongitude()
  longitude!: number;

  @ApiProperty({
    minimum: 1,
    maximum: 100,
    example: 10,
    description: 'Radius in kilometers.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  radius!: number;

  @ApiPropertyOptional({
    description: 'Matches title, description, and address.',
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional({ description: 'Block or sector name.' })
  @IsOptional()
  @IsString()
  subArea?: string;

  @ApiPropertyOptional({ enum: PropertyType })
  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

  @ApiPropertyOptional({ enum: RentalDuration })
  @IsOptional()
  @IsEnum(RentalDuration)
  rentalMode?: RentalDuration;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bedrooms?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bathrooms?: number;

  @ApiPropertyOptional({ enum: FurnishedStatus })
  @IsOptional()
  @IsEnum(FurnishedStatus)
  furnishedStatus?: FurnishedStatus;

  @ApiPropertyOptional({ enum: ListingAvailability })
  @IsOptional()
  @IsEnum(ListingAvailability)
  availability?: ListingAvailability;

  @ApiPropertyOptional({
    type: [String],
    description: 'Comma-separated amenity names.',
  })
  @IsOptional()
  @Transform(({ value }) => parseAmenities(value))
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;
}
