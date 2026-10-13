import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayUnique,
  IsNotEmpty,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

function parseAmenities(value: unknown): unknown {
  if (Array.isArray(value))
    return (value as unknown[]).map((item: unknown) =>
      typeof item === 'string' ? item.trim() : item,
    );
  if (typeof value === 'string')
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  return value;
}

function trimString(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateRoomTypeDto {
  @ApiProperty({ example: 'Deluxe Room' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
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
  @Max(500)
  numberOfRooms!: number;

  @ApiPropertyOptional({ type: [String], example: ['WiFi', 'AC', 'Parking'] })
  @IsOptional()
  @Transform(({ value }) => parseAmenities(value))
  @IsArray()
  @ArrayUnique()
  @MaxLength(50, { each: true })
  @IsNotEmpty({ each: true })
  @IsString({ each: true })
  amenities?: string[];
}
