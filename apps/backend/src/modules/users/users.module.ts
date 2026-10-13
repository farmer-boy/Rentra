import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { TrustScoreModule } from '../trust-score/trust-score.module';

@Module({
  imports: [PrismaModule, TrustScoreModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
