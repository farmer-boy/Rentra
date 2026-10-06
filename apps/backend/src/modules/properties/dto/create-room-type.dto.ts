import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

function parseAmenities(value: unknown) {
  if (Array.isArray(value))
    return value.filter((item): item is string => typeof item === 'string');
  if (typeof value === 'string')
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  return value;
}

export class CreateRoomTypeDto {
  @ApiProperty({ example: 'Deluxe Room' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity!: number;

  @ApiProperty({ example: 15000, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  price!: number;

  @ApiProperty({ example: 3, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  numberOfRooms!: number;

  @ApiPropertyOptional({ type: [String], example: ['WiFi', 'AC', 'Parking'] })
  @IsOptional()
  @Transform(({ value }) => parseAmenities(value))
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];
}
