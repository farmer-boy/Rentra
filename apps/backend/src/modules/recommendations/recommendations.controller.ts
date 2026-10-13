import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { OptionalJwtAuthGuard } from '../properties/guards/optional-jwt-auth.guard';
import { RecommendationQueryDto } from './dto/recommendation-query.dto';
import { RecommendationsService } from './recommendations.service';

@ApiTags('recommendations')
@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get rule-based property recommendations' })
  getRecommendations(
    @Query() query: RecommendationQueryDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.recommendationsService.findAll(query, user?.sub);
  }
}
