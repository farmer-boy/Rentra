import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsObject,
  IsOptional,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreatePropertyVerificationDto {
  @ApiPropertyOptional({
    description: 'Property evidence details visible only to administrators',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  details?: Record<string, unknown>;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUrl({ protocols: ['https'], require_protocol: true }, { each: true })
  @MaxLength(2048, { each: true })
  evidenceUrls?: string[];
}
