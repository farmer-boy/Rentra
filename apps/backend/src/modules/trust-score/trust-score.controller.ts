import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TrustScoreService } from './trust-score.service';

@ApiTags('trust-score')
@Controller()
export class TrustScoreController {
  constructor(private readonly trustScoreService: TrustScoreService) {}

  @Get('users/:id/trust-score')
  @ApiOperation({ summary: 'Get a user trust score and safe score breakdown' })
  async getUserTrustScore(@Param('id') id: string) {
    return this.trustScoreService.getScoreForUser(id);
  }

  @Post('trust-score/recalculate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Recalculate the authenticated user trust score from actual activity records.' })
  async recalculateMyTrustScore(@CurrentUser() user: JwtPayload) {
    return this.trustScoreService.recalculateForUser(user.sub);
  }
}
