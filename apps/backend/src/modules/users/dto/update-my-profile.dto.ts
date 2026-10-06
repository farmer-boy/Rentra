import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

function trimString(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class UpdateMyProfileDto {
  @ApiPropertyOptional({ example: 'Ali Raza', minLength: 2, maxLength: 100 })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({ example: 'ali@example.com' })
  @Transform(({ value }) => normalizeEmail(value))
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+923001234567' })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MinLength(7)
  @MaxLength(20)
  @Matches(/^\+?[0-9\s()-]+$/)
  phone?: string;

  @ApiPropertyOptional({
    example: 'I enjoy finding comfortable places to stay.',
  })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/rentra/image/upload/profile.jpg',
  })
  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  @MaxLength(2048)
  avatarUrl?: string;
}
