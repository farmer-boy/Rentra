import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  FurnishedStatus,
  ListingAvailability,
  ListingPublicationStatus,
  PropertyType,
  RentalDuration,
  HostelGenderPolicy,
} from '@prisma/client';
import { Transform } from 'class-transformer';

export enum ListingSortBy {
  CREATED_AT = 'createdAt',
  RENT = 'rent',
  SIZE = 'sqft',
  TITLE = 'title',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class ListingQueryDto {
  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional({ description: 'Filter by block or sector.' })
  @IsOptional()
  @IsString()
  blockSector?: string;

  @ApiPropertyOptional({ enum: PropertyType })
  @IsOptional()
  @IsEnum(PropertyType)
  propertyType?: PropertyType;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  minRent?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  maxRent?: number;

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

  @ApiPropertyOptional({ enum: ListingPublicationStatus })
  @IsOptional()
  @IsEnum(ListingPublicationStatus)
  publicationStatus?: ListingPublicationStatus;

  @ApiPropertyOptional({ enum: RentalDuration })
  @IsOptional()
  @IsEnum(RentalDuration)
  rentalDuration?: RentalDuration;

  @ApiPropertyOptional({ type: [String], description: 'Comma-separated amenity names.' })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.split(',').map((item) => item.trim()).filter(Boolean) : value)
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({ enum: HostelGenderPolicy })
  @IsOptional()
  @IsEnum(HostelGenderPolicy)
  gender?: HostelGenderPolicy;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsString()
  availableFrom?: string;

  @ApiPropertyOptional({ enum: ListingSortBy, default: ListingSortBy.CREATED_AT })
  @IsOptional()
  @IsEnum(ListingSortBy)
  sortBy = ListingSortBy.CREATED_AT;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder = SortOrder.DESC;
}
