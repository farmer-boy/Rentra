import { IsString, IsOptional } from 'class-validator';

export class UpdateListingStatusDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
