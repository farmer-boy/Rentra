import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AgreementsService } from './agreements.service';
import { TerminateAgreementDto } from './dto/terminate-agreement.dto';

@ApiTags('agreements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agreements')
export class AgreementsController {
  constructor(private readonly agreementsService: AgreementsService) {}

  @Get('my')
  @ApiOperation({
    summary: 'List agreements for the current tenant or landlord',
  })
  async my(@CurrentUser() user: JwtPayload) {
    const agreements = await this.agreementsService.myAgreements(user.sub);
    return {
      message: 'Your agreements',
      data: agreements,
      count: agreements.length,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an agreement as its tenant or landlord' })
  async getById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const agreement = await this.agreementsService.findById(id, user.sub);
    return { message: 'Agreement details', data: agreement };
  }

  @Patch(':id/terminate')
  @ApiOperation({ summary: 'Terminate an active agreement as a participant' })
  async terminate(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: TerminateAgreementDto = {},
  ) {
    const agreement = await this.agreementsService.terminate(id, user.sub, dto);
    return { message: 'Agreement terminated successfully', data: agreement };
  }
}
