import { Module } from '@nestjs/common';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { UploadService } from './upload.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { LocationsModule } from '../locations/locations.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { OptionalJwtAuthGuard } from '../properties/guards/optional-jwt-auth.guard';

@Module({
  imports: [PrismaModule, LocationsModule, AuditModule, AuthModule],
  controllers: [ListingsController],
  providers: [ListingsService, UploadService, OptionalJwtAuthGuard],
  exports: [ListingsService, UploadService],
})
export class ListingsModule {}
