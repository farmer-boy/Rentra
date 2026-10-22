import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export const USER_NOTICE_REASONS = [
  'Verification Required',
  'Documents Needed',
  'Listing Issue',
  'Warning',
  'Important Alert',
  'Other',
] as const;

export class SendUserNoticeDto {
  @ApiProperty({ enum: USER_NOTICE_REASONS })
  @IsIn(USER_NOTICE_REASONS)
  reason!: (typeof USER_NOTICE_REASONS)[number];

  @ApiProperty({ minLength: 1, maxLength: 2000 })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message!: string;
}
