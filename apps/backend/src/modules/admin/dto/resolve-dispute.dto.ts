import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength } from 'class-validator';

export class ResolveDisputeDto {
  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @Matches(/\S/)
  @MaxLength(2000)
  resolution!: string;
}
