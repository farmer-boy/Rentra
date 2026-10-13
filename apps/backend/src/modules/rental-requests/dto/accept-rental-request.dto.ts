import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class AcceptRentalRequestDto {
  @ApiPropertyOptional({
    minimum: 0,
    description: 'Monthly rent; defaults to the listing rent.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  monthlyRent?: number;

  @ApiPropertyOptional({
    minimum: 0,
    description: 'Security deposit; defaults to the listing deposit.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  securityDeposit?: number;

  @ApiPropertyOptional({
    format: 'date',
    description:
      'Agreement start date; defaults to the requested move-in date or today.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate?: string;

  @ApiPropertyOptional({
    format: 'date',
    description:
      'Optional fixed end date; defaults to the requested duration when supplied.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 28, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(28)
  paymentDueDay?: number;

  @ApiPropertyOptional({
    maxLength: 5000,
    description: 'Agreement rules; defaults to the listing rules.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  rules?: string;
}
