import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DisputesService } from './disputes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload';

@ApiTags('disputes')
@Controller('disputes')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async createDispute(
    @CurrentUser() user: JwtPayload,
    @Body() body: { agreementId: string; title: string; description: string },
  ) {
    const dispute = await this.disputesService.create(
      user.sub,
      body.agreementId,
      body.title,
      body.description,
    );
    return {
      message: 'Dispute file ho gaya',
      data: dispute,
    };
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getAllDisputes() {
    const disputes = await this.disputesService.findAll();
    return {
      message: 'Tamam disputes',
      data: disputes,
      count: disputes.length,
    };
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getDisputeById(@Param('id') id: string) {
    const dispute = await this.disputesService.findById(id);
    return {
      message: 'Dispute details',
      data: dispute,
    };
  }

  @Patch(':id/resolve')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async resolveDispute(
    @Param('id') id: string,
    @Body() body: { resolution: string },
  ) {
    const dispute = await this.disputesService.resolve(id, body.resolution);
    return {
      message: 'Dispute resolve ho gaya',
      data: dispute,
    };
  }

  @Patch(':id/close')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async closeDispute(@Param('id') id: string) {
    const dispute = await this.disputesService.close(id);
    return {
      message: 'Dispute close kar diya',
      data: dispute,
    };
  }
}
