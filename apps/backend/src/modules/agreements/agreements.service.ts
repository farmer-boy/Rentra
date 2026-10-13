import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AgreementStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TerminateAgreementDto } from './dto/terminate-agreement.dto';

@Injectable()
export class AgreementsService {
  constructor(private readonly prisma: PrismaService) {}

  async myAgreements(userId: string) {
    await this.expireElapsedAgreements(userId);
    return this.prisma.agreement.findMany({
      where: { OR: [{ tenantId: userId }, { landlordId: userId }] },
      orderBy: { createdAt: 'desc' },
      include: this.agreementInclude(),
    });
  }

  async findById(id: string, userId: string) {
    await this.expireElapsedAgreements(userId, id);
    const agreement = await this.prisma.agreement.findUnique({
      where: { id },
      include: this.agreementInclude(),
    });
    if (!agreement) throw new NotFoundException('Agreement not found');
    this.assertParticipant(agreement.tenantId, agreement.landlordId, userId);
    return agreement;
  }

  async terminate(id: string, userId: string, dto: TerminateAgreementDto = {}) {
    const agreement = await this.prisma.agreement.findUnique({
      where: { id },
      select: {
        id: true,
        tenantId: true,
        landlordId: true,
        status: true,
        endDate: true,
      },
    });
    if (!agreement) throw new NotFoundException('Agreement not found');
    this.assertParticipant(agreement.tenantId, agreement.landlordId, userId);
    if (
      agreement.status !== AgreementStatus.ACTIVE ||
      (agreement.endDate && agreement.endDate <= new Date())
    ) {
      if (
        agreement.status === AgreementStatus.ACTIVE &&
        agreement.endDate &&
        agreement.endDate <= new Date()
      ) {
        await this.prisma.agreement.updateMany({
          where: { id, status: AgreementStatus.ACTIVE },
          data: { status: AgreementStatus.EXPIRED },
        });
      }
      throw new BadRequestException('Only active agreements can be terminated');
    }

    const transition = await this.prisma.agreement.updateMany({
      where: { id, status: AgreementStatus.ACTIVE },
      data: {
        status: AgreementStatus.TERMINATED,
        terminationReason: dto.reason?.trim() || null,
      },
    });
    if (transition.count !== 1) {
      throw new BadRequestException('Only active agreements can be terminated');
    }
    return this.prisma.agreement.findUniqueOrThrow({
      where: { id },
      include: this.agreementInclude(),
    });
  }

  private async expireElapsedAgreements(userId: string, agreementId?: string) {
    await this.prisma.agreement.updateMany({
      where: {
        ...(agreementId ? { id: agreementId } : {}),
        OR: [{ tenantId: userId }, { landlordId: userId }],
        status: AgreementStatus.ACTIVE,
        endDate: { lte: new Date() },
      },
      data: { status: AgreementStatus.EXPIRED },
    });
  }

  private assertParticipant(
    tenantId: string,
    landlordId: string,
    userId: string,
  ) {
    if (tenantId !== userId && landlordId !== userId) {
      throw new ForbiddenException('You cannot access this agreement');
    }
  }

  private agreementInclude() {
    return {
      tenant: {
        select: { id: true, fullName: true, email: true, phone: true },
      },
      landlord: {
        select: { id: true, fullName: true, email: true, phone: true },
      },
      property: { select: { id: true, title: true, city: true, area: true } },
      listing: { select: { id: true, title: true, address: true } },
      rentalRequest: {
        select: {
          id: true,
          status: true,
          moveInDate: true,
          durationMonths: true,
        },
      },
      payments: {
        orderBy: { billingMonth: 'desc' as const },
      },
    } satisfies Prisma.AgreementInclude;
  }
}
