import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { PAYMENT_PROVIDER_ADAPTERS } from './providers/payment-provider.interface';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    { provide: PAYMENT_PROVIDER_ADAPTERS, useValue: [] },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
