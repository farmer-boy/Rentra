import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { OptionalJwtAuthGuard } from '../properties/guards/optional-jwt-auth.guard';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService, OptionalJwtAuthGuard],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
