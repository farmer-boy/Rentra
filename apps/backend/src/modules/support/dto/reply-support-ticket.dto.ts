import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ReplySupportTicketDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(5000)
  body!: string;
}
