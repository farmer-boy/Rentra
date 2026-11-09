import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class TerminateAgreementDto {
  @ApiProperty({
    maxLength: 1000,
    description: 'Required reason recorded with the terminated agreement and shown to both participants.',
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason!: string;
}
