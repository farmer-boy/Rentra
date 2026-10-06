import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class LoginDto {
  @ApiProperty({ example: 'ali@example.com' })
  @Transform(({ value }) => normalizeEmail(value))
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'RentraPass123' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
