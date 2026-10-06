import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { LocationSearchDto } from './dto/location-search.dto';

@ApiTags('locations')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('countries')
  @ApiOperation({ summary: 'List available countries' })
  getCountries() {
    return this.locationsService.getCountries();
  }

  @Get('provinces')
  @ApiOperation({ summary: 'List provinces, optionally scoped to countryId' })
  getProvinces(@Query('countryId') countryId?: string) {
    return this.locationsService.getProvinces(countryId);
  }

  @Get('cities')
  @ApiOperation({ summary: 'List cities, optionally scoped to provinceId' })
  getCities(@Query('provinceId') provinceId?: string) {
    return this.locationsService.getCities(provinceId);
  }

  @Get('areas')
  @ApiOperation({ summary: 'List areas, optionally scoped to cityId' })
  getAreas(@Query('cityId') cityId?: string) {
    return this.locationsService.getAreas(cityId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search locations by text or geographic proximity' })
  search(@Query() query: LocationSearchDto) {
    return this.locationsService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a location with its ancestors and children' })
  getById(@Param('id') id: string) {
    return this.locationsService.findById(id);
  }
}
