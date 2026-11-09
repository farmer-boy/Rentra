import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MaintenanceRequestCategory, MaintenanceRequestPriority } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateMaintenanceRequestDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  agreementId: string;

  @ApiProperty({ enum: MaintenanceRequestCategory })
  @IsEnum(MaintenanceRequestCategory)
  category: MaintenanceRequestCategory;

  @ApiProperty({ maxLength: 120 })
  @IsString()
  @MinLength(4)
  @MaxLength(120)
  subject: string;

  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @ApiPropertyOptional({ enum: MaintenanceRequestPriority })
  @IsOptional()
  @IsEnum(MaintenanceRequestPriority)
  priority?: MaintenanceRequestPriority;
}
