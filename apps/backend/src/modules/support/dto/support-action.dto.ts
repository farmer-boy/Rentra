import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class SupportActionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(1000)
  reason!: string;
}

export class RestrictSupportDto extends SupportActionDto {
  @IsInt()
  @Min(1)
  @Max(30)
  durationDays!: number;
}
