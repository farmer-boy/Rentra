import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { IsEnum, IsString, Matches } from 'class-validator';

export class CreateAgreementPaymentDto {
  @ApiProperty()
  @IsString()
  agreementId: string;

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.BANK_TRANSFER,
  })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({
    example: '2026-11',
    description: 'Billing month in YYYY-MM format.',
  })
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  billingMonth: string;
}
