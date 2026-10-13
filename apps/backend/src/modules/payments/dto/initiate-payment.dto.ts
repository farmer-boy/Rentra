import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentProviderType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';

export class InitiatePaymentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bookingId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  agreementId?: string;

  @ApiPropertyOptional({
    example: '2026-11',
    description: 'Required for agreement rent; format YYYY-MM.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  billingMonth?: string;

  @ApiProperty({ enum: PaymentProviderType })
  @IsEnum(PaymentProviderType)
  provider: PaymentProviderType;
}
