import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, Matches, MaxLength } from 'class-validator';

export class ReviewVerificationDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsIn(['APPROVED', 'REJECTED'])
  decision: 'APPROVED' | 'REJECTED';

  @ApiProperty()
  @IsString()
  @Matches(/\S/)
  @MaxLength(1000)
  reviewNotes: string;
}
