import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { LocationsModule } from '../locations/locations.module';
import { ListingsModule } from '../listings/listings.module';
import { PropertiesController } from './properties.controller';
import { AmenitiesController } from './amenities.controller';
import { PropertiesService } from './properties.service';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';
import { AvailabilityService } from './availability.service';
import { RoomTypesService } from './room-types.service';
import { RoomTypesController } from './room-types.controller';

@Module({
  imports: [PrismaModule, LocationsModule, ListingsModule],
  controllers: [PropertiesController, AmenitiesController, RoomTypesController],
  providers: [PropertiesService, OptionalJwtAuthGuard, AvailabilityService, RoomTypesService],
  exports: [PropertiesService, AvailabilityService],
})
export class PropertiesModule {}
