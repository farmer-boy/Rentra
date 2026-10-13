import { Module } from '@nestjs/common';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { UploadService } from './upload.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { LocationsModule } from '../locations/locations.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, LocationsModule, AuditModule],
  controllers: [ListingsController],
  providers: [ListingsService, UploadService],
  exports: [ListingsService, UploadService],
})
export class ListingsModule {}
