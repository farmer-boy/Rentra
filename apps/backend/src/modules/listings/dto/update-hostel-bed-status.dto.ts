import { ApiProperty } from '@nestjs/swagger';
import { HostelBedStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateHostelBedStatusDto {
  @ApiProperty({ enum: HostelBedStatus })
  @IsEnum(HostelBedStatus)
  status: HostelBedStatus;
}
