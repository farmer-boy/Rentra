import { ApiPropertyOptional } from '@nestjs/swagger';
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
import { FurnishedStatus, PropertyType, RentalDuration } from '@prisma/client';

export enum PropertySearchSort {
  NEWEST = 'newest',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  MOST_VIEWED = 'most_viewed',
  MOST_FAVORITED = 'most_favorited',
  RECOMMENDED = 'recommended',
}

function parseList(value: unknown) {
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

export class PropertySearchDto {
  @ApiPropertyOptional({
    description: 'Matches title, description, address, city, and area.',
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

  @ApiPropertyOptional({
    description: 'Matches a block or sector location node.',
  })
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

  @ApiPropertyOptional({
    type: [String],
    description:
      'Amenity names, comma-separated. A property must match every requested amenity.',
  })
  @IsOptional()
  @Transform(({ value }) => parseList(value))
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({ enum: ['AVAILABLE', 'RENTED'] })
  @IsOptional()
  @IsEnum({ AVAILABLE: 'AVAILABLE', RENTED: 'RENTED' })
  availability?: 'AVAILABLE' | 'RENTED';

  @ApiPropertyOptional({
    example: 31.4697,
    description: 'Center latitude; requires longitude and radiusKm.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({
    example: 74.2728,
    description: 'Center longitude; requires latitude and radiusKm.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100,
    description: 'Search radius in kilometers.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  radiusKm?: number;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({
    enum: PropertySearchSort,
    default: PropertySearchSort.RECOMMENDED,
  })
  @IsOptional()
  @IsEnum(PropertySearchSort)
  sort = PropertySearchSort.RECOMMENDED;
}
