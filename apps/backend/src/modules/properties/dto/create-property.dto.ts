import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  FurnishedStatus,
  ListingAvailability,
  PropertyType,
  RentalDuration,
} from '@prisma/client';

export class CreatePropertyDto {
  @ApiProperty({ example: 'Bright two-bedroom apartment', maxLength: 120 })
  @IsString()
  @MaxLength(120)
  title!: string;

  @ApiPropertyOptional({ maxLength: 5000 })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({ enum: PropertyType })
  @IsEnum(PropertyType)
  type!: PropertyType;

  @ApiProperty({ enum: RentalDuration, example: RentalDuration.MONTHLY })
  @IsEnum(RentalDuration)
  rentalMode!: RentalDuration;

  @ApiProperty({ example: 85000, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  securityDeposit?: number;

  @ApiProperty({ minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bedrooms!: number;

  @ApiProperty({ minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bathrooms!: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  areaSizeSqft?: number;

  @ApiPropertyOptional({ enum: FurnishedStatus })
  @IsOptional()
  @IsEnum(FurnishedStatus)
  furnishedStatus?: FurnishedStatus;

  @ApiPropertyOptional({
    enum: ListingAvailability,
    default: ListingAvailability.AVAILABLE,
  })
  @IsOptional()
  @IsEnum(ListingAvailability)
  availability?: ListingAvailability;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  rules?: string;

  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  address!: string;

  @ApiProperty({ description: 'Country node name for the property location.' })
  @IsString()
  country!: string;

  @ApiProperty({ description: 'Province/state node name.' })
  @IsString()
  province!: string;

  @ApiProperty({ description: 'City node name.' })
  @IsString()
  city!: string;

  @ApiProperty({ description: 'Area or neighborhood node name.' })
  @IsString()
  area!: string;

  @ApiPropertyOptional({ description: 'Optional block/sector below the area.' })
  @IsOptional()
  @IsString()
  blockSector?: string;

  @ApiPropertyOptional({ example: 31.4697, minimum: -90, maximum: 90 })
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: 74.2728, minimum: -180, maximum: 180 })
  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  @Min(-180)
  @Max(180)
  longitude?: number;
}
