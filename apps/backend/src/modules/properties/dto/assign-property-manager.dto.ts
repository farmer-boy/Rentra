import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AssignPropertyManagerDto {
  @ApiProperty({
    description: 'ID of the user to assign as a property manager.',
  })
  @IsString()
  @MinLength(1)
  userId!: string;
}
