import {
  IsOptional,
  IsString,
  IsEmail,
  IsEnum,
  IsBoolean,
  IsArray,
  ArrayUnique,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum Role {
  TENANT = 'TENANT',
  LANDLORD = 'LANDLORD',
  ADMIN = 'ADMIN',
}

export class UpdateUserDto {
  @ApiProperty({ example: 'Ali Raza', required: false })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ example: 'ali@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+923001234567', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: '35202-1234567-1', required: false })
  @IsOptional()
  @IsString()
  cnic?: string;

  @ApiProperty({
    type: [String],
    enum: Role,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(Role, { each: true })
  roles?: Role[];

  @ApiProperty({
    enum: Role,
    required: false,
    description:
      'Legacy alias kept for compatibility while the app uses roles[].',
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isSuspended?: boolean;
}
