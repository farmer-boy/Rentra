import { Module } from '@nestjs/common';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { UploadService } from './upload.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { LocationsModule } from '../locations/locations.module';

@Module({
  imports: [PrismaModule, LocationsModule],
  controllers: [ListingsController],
  providers: [ListingsService, UploadService],
  exports: [ListingsService, UploadService],
})
export class ListingsModule {}
