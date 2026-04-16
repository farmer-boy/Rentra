import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { PropertyType } from '@prisma/client';

export class CreateListingDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsNumber()
  rent: number;

  @IsString()
  area: string;

  @IsNumber()
  sqft: number;

  @IsNumber()
  deposit: number;

  @IsEnum(PropertyType)
  propertyType: PropertyType;

  @IsNumber()
  bedrooms: number;

  @IsNumber()
  bathrooms: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
