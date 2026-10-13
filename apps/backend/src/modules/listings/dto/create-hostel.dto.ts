import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { HostelGenderPolicy } from '@prisma/client';

export class CreateHostelRoomDto {
  @ApiProperty({ example: '101' })
  @IsString()
  @MaxLength(30)
  roomNumber: string;

  @ApiProperty({ example: 'STANDARD', default: 'STANDARD' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  roomType?: string;

  @ApiProperty({ example: 4 })
  @IsInt()
  @Min(1)
  @Max(100)
  capacity: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(0)
  @Max(100)
  availableBeds: number;

  @ApiPropertyOptional({
    enum: HostelGenderPolicy,
    description: 'Overrides the hostel-wide gender policy for this room.',
  })
  @IsOptional()
  @IsEnum(HostelGenderPolicy)
  genderPolicy?: HostelGenderPolicy;

  @ApiPropertyOptional({
    example: 12000,
    minimum: 0,
    description: 'Monthly price per bed; defaults to the listing rent.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;
}

export class CreateHostelDto {
  @ApiProperty({ example: 'University Boys Hostel' })
  @IsString()
  buildingName: string;

  @ApiProperty({ enum: HostelGenderPolicy, example: HostelGenderPolicy.MALE })
  @IsEnum(HostelGenderPolicy)
  genderPolicy: HostelGenderPolicy;

  @ApiProperty({ example: 120, maximum: 1000 })
  @IsInt()
  @Min(1)
  @Max(1000)
  bedCapacity: number;

  @ApiProperty({ example: 24, maximum: 1000 })
  @IsInt()
  @Min(0)
  @Max(1000)
  availableBeds: number;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  messIncluded?: boolean;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  wifiIncluded?: boolean;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  laundryIncluded?: boolean;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  electricityIncluded?: boolean;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  securityIncluded?: boolean;

  @ApiProperty({ type: [CreateHostelRoomDto], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateHostelRoomDto)
  rooms: CreateHostelRoomDto[];
}
