import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportStatus } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ModerateReportDto {
  @ApiProperty({ enum: ReportStatus })
  @IsEnum(ReportStatus)
  status!: ReportStatus;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resolutionNote?: string;

  @ApiPropertyOptional({
    description: 'Set true only for a documented, confirmed policy violation.',
  })
  @IsOptional()
  @IsBoolean()
  violationConfirmed?: boolean;
}

export class ResolveReportDto {
  @ApiProperty({ minLength: 1, maxLength: 2000 })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  resolutionNote!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  violationConfirmed?: boolean;
}

export class AssignReportDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  adminId!: string;
}
