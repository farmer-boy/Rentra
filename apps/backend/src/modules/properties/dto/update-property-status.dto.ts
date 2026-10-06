import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PropertyStatus } from '@prisma/client';

export class UpdatePropertyStatusDto {
  @ApiProperty({ enum: PropertyStatus })
  @IsEnum(PropertyStatus)
  status!: PropertyStatus;
}
