import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { SavedSearchFiltersDto } from './saved-search-filters.dto';

export class CreateSavedSearchDto {
  @ApiProperty({ example: 'Two-bedroom apartments in central Lahore' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ type: SavedSearchFiltersDto })
  @ValidateNested()
  @Type(() => SavedSearchFiltersDto)
  filters!: SavedSearchFiltersDto;
}
