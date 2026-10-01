import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateLandlordProfileDto {
  @ApiPropertyOptional({ example: 'Ali Properties' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  displayName?: string;

  @ApiPropertyOptional({ example: 'Family-owned rental properties in Lahore.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatars/ali.jpg' })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
