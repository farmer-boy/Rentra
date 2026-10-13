import { ApiProperty } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class RevokeVerificationDto {
  @ApiProperty({ example: 'Evidence was invalidated after review.' })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : undefined,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  reviewNotes: string;
}
