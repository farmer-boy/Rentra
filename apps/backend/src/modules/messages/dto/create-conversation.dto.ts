import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({ description: 'User ID of the other participant.' })
  @IsString()
  @MinLength(1)
  otherUserId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  listingId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bookingId?: string;
}
