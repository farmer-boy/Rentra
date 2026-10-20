import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleLoginDto {
  @ApiProperty({ description: 'Google Identity Services ID token credential' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(8192)
  credential: string;
}
