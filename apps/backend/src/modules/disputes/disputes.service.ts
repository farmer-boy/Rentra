import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class DisputesService {
  constructor(private prisma: PrismaService) {}

  async create(
    tenantId: string,
    agreementId: string,
    title: string,
    description: string,
  ) {
    return await this.prisma.dispute.create({
      data: {
        tenantId,
        agreementId,
        title,
        description,
        status: 'OPEN',
      },
    });
  }

  async findAll() {
    return await this.prisma.dispute.findMany({
      include: {
        tenant: { select: { id: true, fullName: true, email: true } },
        agreement: {
          include: {
            landlord: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });
  }

  async findById(id: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      include: {
        tenant: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        agreement: {
          include: {
            landlord: {
              select: { id: true, fullName: true, email: true, phone: true },
            },
          },
        },
      },
    });

    if (!dispute) throw new BadRequestException('Dispute nahi mila');
    return dispute;
  }

  async resolve(id: string, resolution: string) {
    const dispute = await this.prisma.dispute.findUnique({ where: { id } });
    if (!dispute) throw new BadRequestException('Dispute nahi mila');

    return await this.prisma.dispute.update({
      where: { id },
      data: { status: 'RESOLVED', resolution },
    });
  }

  async close(id: string) {
    const dispute = await this.prisma.dispute.findUnique({ where: { id } });
    if (!dispute) throw new BadRequestException('Dispute nahi mila');

    return await this.prisma.dispute.update({
      where: { id },
      data: { status: 'CLOSED' },
    });
  }
}
