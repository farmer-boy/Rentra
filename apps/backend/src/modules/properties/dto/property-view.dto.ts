import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class PropertyViewDto {
  @ApiPropertyOptional({
    description:
      'Stable browser-session UUID for anonymous view deduplication.',
  })
  @IsOptional()
  @IsUUID()
  sessionId?: string;
}
