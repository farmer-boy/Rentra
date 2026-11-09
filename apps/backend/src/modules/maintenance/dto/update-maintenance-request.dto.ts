import { ApiProperty } from '@nestjs/swagger';
import { MaintenanceRequestStatus } from '@prisma/client';
import { IsIn } from 'class-validator';

export class UpdateMaintenanceRequestDto {
  @ApiProperty({ enum: [MaintenanceRequestStatus.IN_PROGRESS, MaintenanceRequestStatus.RESOLVED] })
  @IsIn([MaintenanceRequestStatus.IN_PROGRESS, MaintenanceRequestStatus.RESOLVED])
  status: 'IN_PROGRESS' | 'RESOLVED';
}
