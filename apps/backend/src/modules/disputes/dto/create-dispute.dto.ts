import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DisputeType } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateDisputeDto {
  @ApiProperty({ enum: DisputeType })
  @IsEnum(DisputeType)
  type!: DisputeType;

  @ApiProperty({ description: 'Short reason for opening the dispute.' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  reason!: string;

  @ApiProperty({ maxLength: 4000 })
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  description!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  bookingId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  paymentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  agreementId?: string;
}
