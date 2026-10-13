import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseEnumPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentProviderType } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'Initiate a booking or agreement payment; amount and payer are resolved server-side',
  })
  initiate(
    @CurrentUser() user: JwtPayload,
    @Body() dto: InitiatePaymentDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.paymentsService.initiate(user.sub, dto, idempotencyKey?.trim());
  }

  @Get('my')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List payments visible to the current user' })
  async my(@CurrentUser() user: JwtPayload) {
    const payments = await this.paymentsService.getMyPayments(user.sub);
    return { message: 'Your payment records', data: payments };
  }

  @Get('tenant/my-payments')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async myLegacy(@CurrentUser() user: JwtPayload) {
    const payments = await this.paymentsService.getMyPayments(user.sub);
    return {
      message: 'Your payment records',
      data: payments,
      count: payments.length,
    };
  }

  @Get('agreement/:agreementId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async byAgreement(
    @Param('agreementId') agreementId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const payments = await this.paymentsService.getAgreementPayments(
      agreementId,
      user.sub,
    );
    return { message: 'Agreement payments', data: payments };
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async list(@CurrentUser() user: JwtPayload) {
    const payments = await this.paymentsService.getMyPayments(user.sub);
    return {
      message: 'Your payment records',
      data: payments,
      count: payments.length,
    };
  }

  @Post('providers/:provider/webhook')
  @ApiOperation({
    summary:
      'Provider callback; the provider adapter must verify its official signature before processing',
  })
  webhook(
    @Param('provider', new ParseEnumPipe(PaymentProviderType))
    provider: PaymentProviderType,
    @Req() request: RawBodyRequest<Request>,
    @Body() parsedPayload: unknown,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    return this.paymentsService.handleWebhook(
      provider,
      request.rawBody ?? parsedPayload,
      headers,
    );
  }

  @Post(':id/verify')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'Verify transaction status server-to-server with its configured provider',
  })
  verify(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.paymentsService.verify(id, user.sub);
  }

  @Post(':id/refund')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Request a provider-verified full refund' })
  refund(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.paymentsService.refund(id, user.sub);
  }

  @Get(':id/receipt')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a receipt for a verified successful payment' })
  receipt(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.paymentsService.getReceipt(id, user.sub);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.paymentsService.getById(id, user.sub);
  }
}
