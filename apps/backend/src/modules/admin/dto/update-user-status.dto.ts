import { IsString, IsOptional } from 'class-validator';

export class UpdateUserStatusDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
