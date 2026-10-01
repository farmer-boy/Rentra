import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { HostelGenderPolicy } from '@prisma/client';

export class CreateHostelRoomDto {
  @ApiProperty({ example: '101' })
  @IsString()
  roomNumber: string;

  @ApiProperty({ example: 4 })
  @IsInt()
  @Min(1)
  capacity: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(0)
  availableBeds: number;
}

export class CreateHostelDto {
  @ApiProperty({ example: 'University Boys Hostel' })
  @IsString()
  buildingName: string;

  @ApiProperty({ enum: HostelGenderPolicy, example: HostelGenderPolicy.MALE })
  @IsEnum(HostelGenderPolicy)
  genderPolicy: HostelGenderPolicy;

  @ApiProperty({ example: 120 })
  @IsInt()
  @Min(1)
  bedCapacity: number;

  @ApiProperty({ example: 24 })
  @IsInt()
  @Min(0)
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
