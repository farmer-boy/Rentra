import { SupportTicketCategory } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSupportTicketDto {
  @IsEnum(SupportTicketCategory)
  category!: SupportTicketCategory;

  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(120)
  subject!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(5000)
  message!: string;
}
