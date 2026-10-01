import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  IsUrl,
  Min,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  FurnishedStatus,
  ListingAvailability,
  RentalDuration,
  PropertyType,
} from '@prisma/client';
import { CreateHostelDto } from './create-hostel.dto';

export class CreateListingDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  title: string;

  @ApiProperty()
  @IsString()
  @MaxLength(5000)
  description: string;

  @ApiProperty({ required: false, description: 'House rules and rental conditions.' })
  @IsOptional()
  @IsString()
  rules?: string;

  @ApiProperty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty({ example: 'Pakistan', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: 'Punjab', required: false })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  rent: number;

  @ApiProperty()
  @IsString()
  area: string;

  @ApiProperty({ example: 'Block H', required: false, description: 'Block or sector within the selected area.' })
  @IsOptional()
  @IsString()
  blockSector?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  sqft: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  deposit: number;

  @ApiProperty({ enum: RentalDuration, default: RentalDuration.MONTHLY })
  @IsOptional()
  @IsEnum(RentalDuration)
  rentalDuration?: RentalDuration;

  @ApiProperty({ required: false, type: String, format: 'date-time' })
  @IsOptional()
  @IsString()
  availableFrom?: string;

  @ApiProperty({ required: false, example: 31.4697 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ required: false, example: 74.2728 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ enum: PropertyType })
  @IsEnum(PropertyType)
  propertyType: PropertyType;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  bedrooms: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  bathrooms: number;

  @ApiProperty({ example: 1, default: 1, description: 'Number of rentable units in this property.' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  unitCount?: number;

  @ApiProperty({ example: 3, default: 0, description: 'Total rooms available across the property or unit.' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  roomCount?: number;

  @ApiProperty({ enum: FurnishedStatus, required: false })
  @IsOptional()
  @IsEnum(FurnishedStatus)
  furnishedStatus?: FurnishedStatus;

  @ApiProperty({ enum: ListingAvailability, required: false })
  @IsOptional()
  @IsEnum(ListingAvailability)
  availability?: ListingAvailability;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ type: [String], required: false, description: 'Additional property image URLs.' })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  imageUrls?: string[];

  @ApiProperty({ type: [String], required: false, description: 'Amenity names for this property.' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiProperty({ type: CreateHostelDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateHostelDto)
  hostel?: CreateHostelDto;
}
