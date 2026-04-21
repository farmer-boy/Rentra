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
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { PaymentMethod } from '@prisma/client';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async createPayment(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: { amount: number; method: PaymentMethod; agreementId: string },
  ) {
    const payment = await this.paymentsService.create(
      user.sub,
      body.amount,
      body.method,
      body.agreementId,
    );
    return {
      message: 'Payment created successfully',
      data: payment,
    };
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getAllPayments() {
    const payments = await this.paymentsService.findAll();
    return {
      message: 'Tamam payments',
      data: payments,
      count: payments.length,
    };
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getPaymentById(@Param('id') id: string) {
    const payment = await this.paymentsService.findById(id);
    return {
      message: 'Payment details',
      data: payment,
    };
  }

  @Patch(':id/complete')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async completePayment(@Param('id') id: string) {
    const payment = await this.paymentsService.complete(id);
    return {
      message: 'Payment completed successfully',
      data: payment,
    };
  }

  @Patch(':id/fail')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async failPayment(@Param('id') id: string) {
    const payment = await this.paymentsService.fail(id);
    return {
      message: 'Payment failed',
      data: payment,
    };
  }

  @Get('tenant/my-payments')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getMyPayments(@CurrentUser() user: JwtPayload) {
    const payments = await this.paymentsService.getByTenant(user.sub);
    return {
      message: 'Aapki payments',
      data: payments,
      count: payments.length,
    };
  }
}
