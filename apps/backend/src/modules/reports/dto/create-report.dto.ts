import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportTargetType } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum ReportReason {
  FAKE_LISTING = 'FAKE_LISTING',
  SCAM = 'SCAM',
  WRONG_INFORMATION = 'WRONG_INFORMATION',
  DUPLICATE_LISTING = 'DUPLICATE_LISTING',
  HARASSMENT = 'HARASSMENT',
  PAYMENT_ISSUE = 'PAYMENT_ISSUE',
  OTHER = 'OTHER',
}

export class CreateReportDto {
  @ApiProperty({ enum: ReportTargetType })
  @IsEnum(ReportTargetType)
  targetType!: ReportTargetType;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  targetId!: string;

  @ApiProperty({ enum: ReportReason })
  @IsEnum(ReportReason)
  reason!: ReportReason;

  @ApiPropertyOptional({ maxLength: 4000 })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;
}
