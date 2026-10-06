import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';

@ApiTags('amenities')
@Controller('amenities')
export class AmenitiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  @ApiOperation({ summary: 'List amenity catalog options' })
  getAmenities() {
    return this.propertiesService.getAmenities();
  }
}
