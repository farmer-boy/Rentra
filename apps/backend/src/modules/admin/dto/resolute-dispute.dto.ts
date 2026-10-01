import { IsString } from 'class-validator';

export class ResoluteDisputeDto {
  @IsString()
  resolution: string;
}
