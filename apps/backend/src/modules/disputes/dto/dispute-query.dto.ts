import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DisputeStatus, DisputeType } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class DisputeQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({ enum: DisputeStatus })
  @IsOptional()
  @IsEnum(DisputeStatus)
  status?: DisputeStatus;

  @ApiPropertyOptional({ enum: DisputeType })
  @IsOptional()
  @IsEnum(DisputeType)
  type?: DisputeType;
}
