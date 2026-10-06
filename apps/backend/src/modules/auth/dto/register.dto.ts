import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class RegisterDto {
  @ApiProperty({ example: 'Ali Raza', minLength: 2, maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  fullName!: string;

  @ApiProperty({ example: 'ali@example.com' })
  @Transform(({ value }) => normalizeEmail(value))
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '+923001234567' })
  @IsString()
  @MinLength(7)
  @MaxLength(20)
  @Matches(/^\+?[0-9\s()-]+$/)
  phone!: string;

  @ApiProperty({ example: 'RentraPass123', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
