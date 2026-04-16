import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum Role {
  TENANT = 'TENANT',
  LANDLORD = 'LANDLORD',
  ADMIN = 'ADMIN',
}

export class CreateUserDto {
  @ApiProperty({ example: 'Ali Raza' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'ali@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+923001234567' })
  @IsPhoneNumber('PK')
  phone: string;

  @ApiProperty({ example: '35202-1234567-1' })
  @IsString()
  @Matches(/^\d{5}-\d{7}-\d{1}$/, {
    message: 'CNIC must be in format XXXXX-XXXXXXX-X',
  })
  cnic: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: Role, default: Role.TENANT })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiProperty({ example: 50, default: 50 })
  @IsOptional()
  trustScore?: number;
}
