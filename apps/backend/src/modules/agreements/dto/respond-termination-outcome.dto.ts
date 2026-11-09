import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class RespondTerminationOutcomeDto {
  @IsIn(['ACCEPT_REJECTION', 'CONTEST'])
  decision!: 'ACCEPT_REJECTION' | 'CONTEST';

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
