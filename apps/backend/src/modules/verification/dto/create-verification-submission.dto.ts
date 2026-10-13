import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateVerificationSubmissionDto {
  @ApiProperty({ enum: ['IDENTITY', 'HOST'] })
  @IsIn(['IDENTITY', 'HOST'])
  kind: 'IDENTITY' | 'HOST';

  @ApiPropertyOptional({
    description:
      'Verification details visible only to authorized administrators',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  details?: Record<string, unknown>;

  @ApiPropertyOptional({
    type: [String],
    description: 'HTTPS evidence links for administrator review',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUrl({ protocols: ['https'], require_protocol: true }, { each: true })
  @MaxLength(2048, { each: true })
  evidenceUrls?: string[];
}
