import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { RentalRequestsController } from './rental-requests.controller';
import { RentalRequestsService } from './rental-requests.service';

@Module({
  imports: [PrismaModule],
  controllers: [RentalRequestsController],
  providers: [RentalRequestsService],
  exports: [RentalRequestsService],
})
export class RentalRequestsModule {}
