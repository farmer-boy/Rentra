import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PropertyType } from '@prisma/client';

export class CreateListingDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsNumber()
  rent: number;

  @ApiProperty()
  @IsString()
  area: string;

  @ApiProperty()
  @IsNumber()
  sqft: number;

  @ApiProperty()
  @IsNumber()
  deposit: number;

  @ApiProperty({ enum: PropertyType })
  @IsEnum(PropertyType)
  propertyType: PropertyType;

  @ApiProperty()
  @IsNumber()
  bedrooms: number;

  @ApiProperty()
  @IsNumber()
  bathrooms: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
