import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AgreementsService } from './agreements.service';
import { TerminateAgreementDto } from './dto/terminate-agreement.dto';
import { CreateAgreementAmendmentDto } from './dto/create-agreement-amendment.dto';
import { RespondAgreementAmendmentDto } from './dto/respond-agreement-amendment.dto';
import { RespondTerminationRequestDto } from './dto/respond-termination-request.dto';
import { RespondTerminationOutcomeDto } from './dto/respond-termination-outcome.dto';
import { CreateTerminationReviewDto } from './dto/create-termination-review.dto';

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

  @Post(':id/presence')
  @ApiOperation({ summary: 'Mark that a participant currently has this agreement page open' })
  async markPageOpen(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return { data: await this.agreementsService.markPageOpen(id, user.sub) };
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
    @Body() dto: TerminateAgreementDto,
  ) {
    const request = await this.agreementsService.terminate(id, user.sub, dto);
    return { message: 'Agreement cancellation request sent', data: request };
  }

  @Patch(':id/termination-requests/:requestId/respond')
  @ApiOperation({ summary: 'Approve or reject a cancellation request' })
  async respondToTermination(
    @Param('id') id: string,
    @Param('requestId') requestId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: RespondTerminationRequestDto,
  ) {
    const agreement = await this.agreementsService.respondToTerminationRequest(id, requestId, user.sub, dto);
    return { message: 'Cancellation request response recorded', data: agreement };
  }

  @Patch(':id/termination-requests/:requestId/outcome')
  @ApiOperation({ summary: 'Accept or contest a rejected cancellation request' })
  async respondToTerminationOutcome(
    @Param('id') id: string,
    @Param('requestId') requestId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: RespondTerminationOutcomeDto,
  ) {
    const agreement = await this.agreementsService.respondToTerminationOutcome(id, requestId, user.sub, dto);
    return { message: 'Cancellation response recorded', data: agreement };
  }

  @Post(':id/termination-requests/:requestId/reviews')
  @ApiOperation({ summary: 'Review the other party after an approved agreement cancellation' })
  async createTerminationReview(
    @Param('id') id: string,
    @Param('requestId') requestId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTerminationReviewDto,
  ) {
    const review = await this.agreementsService.createTerminationReview(id, requestId, user.sub, dto);
    return { message: 'Review saved', data: review };
  }

  @Post(':id/amendments')
  @ApiOperation({ summary: 'Propose new rent and deposit terms as landlord' })
  async proposeAmendment(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAgreementAmendmentDto,
  ) {
    const amendment = await this.agreementsService.proposeAmendment(id, user.sub, dto);
    return { message: 'Agreement update sent to tenant', data: amendment };
  }

  @Patch(':id/amendments/:amendmentId/respond')
  @ApiOperation({ summary: 'Accept or reject a proposed agreement update as tenant' })
  async respondToAmendment(
    @Param('id') id: string,
    @Param('amendmentId') amendmentId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: RespondAgreementAmendmentDto,
  ) {
    const agreement = await this.agreementsService.respondToAmendment(id, amendmentId, user.sub, dto);
    return { message: 'Agreement update response recorded', data: agreement };
  }
}
