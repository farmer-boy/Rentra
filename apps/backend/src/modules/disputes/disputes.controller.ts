import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { DisputeQueryDto } from './dto/dispute-query.dto';
import { DisputesService } from './disputes.service';

@ApiTags('disputes')
@ApiBearerAuth()
@Controller('disputes')
@UseGuards(JwtAuthGuard)
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateDisputeDto,
  ) {
    return this.disputesService.create(user.sub, dto);
  }

  @Get('my')
  getMine(
    @CurrentUser() user: JwtPayload,
    @Query() query: DisputeQueryDto,
  ) {
    return this.disputesService.getMine(user.sub, query);
  }

  @Get(':id')
  getById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.disputesService.getById(
      id,
      user.sub,
      user.roles.includes('ADMIN'),
    );
  }
}
