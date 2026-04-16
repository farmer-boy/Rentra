import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum Role {
  TENANT = 'TENANT',
  LANDLORD = 'LANDLORD',
}

export class RegisterDto {
  @ApiProperty({ example: 'Ali Raza' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'ali@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+923001234567' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '35202-1234567-1' })
  @IsString()
  cnic: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: Role, default: Role.TENANT })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
