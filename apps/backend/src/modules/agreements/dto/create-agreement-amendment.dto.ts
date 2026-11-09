import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateAgreementAmendmentDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  proposedMonthlyRent!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  proposedSecurityDeposit!: number;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
