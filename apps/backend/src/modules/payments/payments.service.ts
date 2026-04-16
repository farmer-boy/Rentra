import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaymentMethod } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(
    tenantId: string,
    amount: number,
    method: PaymentMethod,
    agreementId: string,
  ) {
    return await this.prisma.payment.create({
      data: {
        tenantId,
        amount,
        method,
        agreementId,
        status: 'PENDING',
        month: new Date(),
      },
    });
  }

  async findAll() {
    return await this.prisma.payment.findMany({
      include: {
        tenant: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  async findById(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        tenant: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!payment) throw new BadRequestException('Payment nahi mila');
    return payment;
  }

  async complete(id: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new BadRequestException('Payment nahi mila');

    return await this.prisma.payment.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });
  }

  async fail(id: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new BadRequestException('Payment nahi mila');

    return await this.prisma.payment.update({
      where: { id },
      data: { status: 'FAILED' },
    });
  }

  async getByTenant(tenantId: string) {
    return await this.prisma.payment.findMany({
      where: { tenantId },
    });
  }
}
