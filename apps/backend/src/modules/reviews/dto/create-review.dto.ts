import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ enum: ReviewType })
  @IsEnum(ReviewType)
  reviewType!: ReviewType;

  @ApiPropertyOptional({
    description: 'Required only for legacy property reviews',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  listingId?: string;

  @ApiPropertyOptional({
    description: 'Completed short-term booking for a property review',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  bookingId?: string;

  @ApiPropertyOptional({
    description: 'Completed rental agreement for a person-to-person review',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  agreementId?: string;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 5,
    description:
      'Legacy property-review rating; person-review rating is calculated',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  behaviour?: number;

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
  propertyCondition?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  honesty?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  maintenance?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  responseTime?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rentPayment?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  propertyCare?: number;

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
  facilities?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  agreementCompliance?: number;

  @ApiPropertyOptional({
    description: 'Whether you would recommend this person',
  })
  @IsOptional()
  @IsBoolean()
  wouldRecommend?: boolean;
}
