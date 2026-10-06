import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RentalRequestsController } from './rental-requests.controller';
import { RentalRequestsService } from './rental-requests.service';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [RentalRequestsController],
  providers: [RentalRequestsService],
  exports: [RentalRequestsService],
})
export class RentalRequestsModule {}
