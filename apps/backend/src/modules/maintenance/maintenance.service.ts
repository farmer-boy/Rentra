import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AgreementStatus, MaintenanceRequestStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateMaintenanceRequestDto } from './dto/create-maintenance-request.dto';

const maintenanceInclude = {
  property: { select: { id: true, title: true, city: true, area: true } },
  tenant: { select: { id: true, fullName: true } },
  landlord: { select: { id: true, fullName: true } },
  agreement: { select: { id: true, startDate: true, endDate: true } },
} satisfies Prisma.MaintenanceRequestInclude;

@Injectable()
export class MaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateMaintenanceRequestDto) {
    const agreement = await this.prisma.agreement.findFirst({
      where: {
        id: dto.agreementId,
        tenantId,
        status: AgreementStatus.ACTIVE,
        startDate: { lte: new Date() },
        OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
      },
      select: { id: true, propertyId: true, landlordId: true },
    });
    if (!agreement) {
      throw new NotFoundException('An active rental agreement was not found');
    }
    if (!agreement.propertyId) {
      throw new BadRequestException(
        'Maintenance requests are unavailable for this legacy listing-only agreement',
      );
    }

    return this.prisma.maintenanceRequest.create({
      data: {
        agreementId: agreement.id,
        propertyId: agreement.propertyId,
        tenantId,
        landlordId: agreement.landlordId,
        category: dto.category,
        priority: dto.priority,
        subject: dto.subject.trim(),
        description: dto.description.trim(),
      },
      include: maintenanceInclude,
    });
  }

  mine(tenantId: string) {
    return this.prisma.maintenanceRequest.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: maintenanceInclude,
    });
  }

  received(landlordId: string) {
    return this.prisma.maintenanceRequest.findMany({
      where: { landlordId },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: maintenanceInclude,
    });
  }

  async updateStatus(
    id: string,
    landlordId: string,
    status: 'IN_PROGRESS' | 'RESOLVED',
  ) {
    const request = await this.prisma.maintenanceRequest.findFirst({
      where: { id, landlordId },
      select: { id: true, status: true },
    });
    if (!request) throw new NotFoundException('Maintenance request not found');
    if (request.status === MaintenanceRequestStatus.RESOLVED) {
      throw new BadRequestException('A resolved maintenance request cannot be reopened');
    }

    await this.prisma.maintenanceRequest.update({
      where: { id },
      data: {
        status,
        resolvedAt: status === MaintenanceRequestStatus.RESOLVED ? new Date() : null,
      },
    });
    return this.prisma.maintenanceRequest.findUniqueOrThrow({
      where: { id },
      include: maintenanceInclude,
    });
  }
}
