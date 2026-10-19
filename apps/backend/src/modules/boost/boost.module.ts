import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BoostController } from './boost.controller';
import { BoostService } from './boost.service';

@Module({
  imports: [PrismaModule],
  controllers: [BoostController],
  providers: [BoostService, JwtAuthGuard, RolesGuard],
  exports: [BoostService],
})
export class BoostModule {}
