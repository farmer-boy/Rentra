import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ enum: ReviewType })
  @IsEnum(ReviewType)
  reviewType!: ReviewType;

  @ApiProperty({ description: 'Listing associated with the completed rental' })
  @IsString()
  @IsNotEmpty()
  listingId!: string;

  @ApiPropertyOptional({
    description: 'Completed short-term booking; provide this or agreementId',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  bookingId?: string;

  @ApiPropertyOptional({
    description: 'Completed long-term agreement; provide this or bookingId',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  agreementId?: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  cleanliness?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  location?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  accuracy?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  communication?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  facilities?: number;
}
