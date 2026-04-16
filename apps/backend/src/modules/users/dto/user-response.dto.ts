import { ApiProperty } from '@nestjs/swagger';

export enum Role {
  TENANT = 'TENANT',
  LANDLORD = 'LANDLORD',
  ADMIN = 'ADMIN',
}

export class UserResponseDto {
  @ApiProperty({ example: 'ck8j2d3h4e5f6g7h8i9j0k1' })
  id: string;

  @ApiProperty({ example: 'ali@example.com' })
  email: string;

  @ApiProperty({ example: '+923001234567' })
  phone: string;

  @ApiProperty({ example: 'Ali Raza' })
  fullName: string;

  @ApiProperty({ example: '35202-1234567-1' })
  cnic: string;

  @ApiProperty({ enum: Role, example: Role.TENANT })
  role: Role;

  @ApiProperty({ example: 75, minimum: 0, maximum: 100 })
  trustScore: number;

  @ApiProperty({ example: true })
  isVerified: boolean;

  @ApiProperty({ example: false })
  isSuspended: boolean;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;
}
