import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AgreementsService {
  constructor(private prisma: PrismaService) {}

  async create(
    tenantId: string,
    landlordId: string,
    listingId: string,
    rent: number,
    deposit: number,
    startDate: string,
    endDate: string,
  ) {
    return await this.prisma.agreement.create({
      data: {
        tenantId,
        landlordId,
        listingId,
        rent,
        deposit,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'PENDING',
      },
    });
  }

  async findAll() {
    return await this.prisma.agreement.findMany({
      include: {
        tenant: { select: { id: true, fullName: true, email: true } },
        landlord: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  async findById(id: string) {
    const agreement = await this.prisma.agreement.findUnique({
      where: { id },
      include: {
        tenant: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        landlord: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
      },
    });

    if (!agreement) throw new BadRequestException('Agreement nahi mila');
    return agreement;
  }

  async approve(id: string) {
    const agreement = await this.prisma.agreement.findUnique({ where: { id } });
    if (!agreement) throw new BadRequestException('Agreement nahi mila');

    return await this.prisma.agreement.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
  }

  async reject(id: string) {
    const agreement = await this.prisma.agreement.findUnique({ where: { id } });
    if (!agreement) throw new BadRequestException('Agreement nahi mila');

    return await this.prisma.agreement.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async terminate(id: string) {
    const agreement = await this.prisma.agreement.findUnique({ where: { id } });
    if (!agreement) throw new BadRequestException('Agreement nahi mila');

    return await this.prisma.agreement.update({
      where: { id },
      data: { status: 'EXPIRED' },
    });
  }
}
