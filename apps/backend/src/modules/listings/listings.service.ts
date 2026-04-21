import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';

@Injectable()
export class ListingsService {
  constructor(private prisma: PrismaService) {}

  async create(landlordId: string, dto: CreateListingDto) {
    return await this.prisma.listing.create({
      data: {
        title: dto.title,
        description: dto.description,
        address: dto.address,
        city: dto.city,
        area: dto.area,
        rent: dto.rent,
        deposit: dto.deposit,
        sqft: dto.sqft,
        type: dto.propertyType,
        bedrooms: dto.bedrooms,
        bathrooms: dto.bathrooms,
        landlordId,
      },
    });
  }

  async findAll(filters?: { city?: string; propertyType?: string }) {
    return await this.prisma.listing.findMany({
      where: filters,
      include: {
        landlord: { select: { id: true, fullName: true, phone: true } },
      },
    });
  }

  async findById(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        landlord: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
      },
    });

    if (!listing) {
      throw new BadRequestException('Listing not found');
    }

    return listing;
  }

  async update(id: string, landlordId: string, dto: Partial<CreateListingDto>) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing || listing.landlordId !== landlordId) {
      throw new BadRequestException('Cannot update this listing');
    }

    return await this.prisma.listing.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string, landlordId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing || listing.landlordId !== landlordId) {
      throw new BadRequestException('Cannot delete this listing');
    }

    return await this.prisma.listing.delete({ where: { id } });
  }

  async getByLandlord(landlordId: string) {
    return await this.prisma.listing.findMany({
      where: { landlordId },
    });
  }
}
