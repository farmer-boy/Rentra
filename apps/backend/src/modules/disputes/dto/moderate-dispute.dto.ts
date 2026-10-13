import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DisputeStatus } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ModerateDisputeDto {
  @ApiProperty({ enum: DisputeStatus })
  @IsEnum(DisputeStatus)
  status!: DisputeStatus;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resolutionNote?: string;
}

export class ResolveDisputeDto {
  @ApiProperty({ minLength: 1, maxLength: 2000 })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  resolutionNote!: string;
}

export class AssignDisputeDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  adminId!: string;
}
