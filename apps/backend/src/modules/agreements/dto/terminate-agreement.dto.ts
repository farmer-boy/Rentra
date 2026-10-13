import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class TerminateAgreementDto {
  @ApiPropertyOptional({
    maxLength: 1000,
    description: 'Reason recorded with the terminated agreement.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
