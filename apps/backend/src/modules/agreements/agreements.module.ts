import { Module } from '@nestjs/common';
import { AgreementsController } from './agreements.controller';
import { AgreementsService } from './agreements.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { TrustScoreModule } from '../trust-score/trust-score.module';

@Module({
  imports: [PrismaModule, TrustScoreModule],
  controllers: [AgreementsController],
  providers: [AgreementsService],
  exports: [AgreementsService],
})
export class AgreementsModule {}
