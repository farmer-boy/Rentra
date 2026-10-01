import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsArray,
  ArrayUnique,
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

  @ApiProperty({
    example: '35202-1234567-1',
    required: false,
    description: 'Optional at signup; can be added later during verification.',
  })
  @IsOptional()
  @IsString()
  cnic?: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    type: [String],
    enum: Role,
    default: [Role.TENANT],
    required: false,
    description: 'A single user account can start as a tenant and later gain landlord access.',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(Role, { each: true })
  roles?: Role[];

  @ApiProperty({
    enum: Role,
    required: false,
    description: 'Legacy alias kept for compatibility while the app uses roles[].',
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
