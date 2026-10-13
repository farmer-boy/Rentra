import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { TrustScoreController } from './trust-score.controller';
import { TrustScoreService } from './trust-score.service';

@Module({
  imports: [PrismaModule],
  controllers: [TrustScoreController],
  providers: [TrustScoreService],
  exports: [TrustScoreService],
})
export class TrustScoreModule {}
