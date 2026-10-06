import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, ArrayUnique, IsArray, IsString } from 'class-validator';

export class SetPropertyAmenitiesDto {
  @ApiProperty({
    type: [String],
    description: 'Amenity IDs returned by GET /amenities.',
    example: ['clxwifiid', 'clxparkingid'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  amenityIds!: string[];
}
