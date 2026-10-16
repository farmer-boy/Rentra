import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FurnishedStatus,
  HostelBedStatus,
  ListingAvailability,
  ListingStatus,
  ListingPublicationStatus,
  Prisma,
  RentalDuration,
  VerificationStatus,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AmenitiesDto } from './dto/amenities.dto';
import { CreateListingDto } from './dto/create-listing.dto';
import {
  ListingQueryDto,
  ListingSortBy,
  SortOrder,
} from './dto/listing-query.dto';
import { PropertyImageDto } from './dto/property-image.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { UpdateHostelBedStatusDto } from './dto/update-hostel-bed-status.dto';
import { LocationsService } from '../locations/locations.service';
import { AuditService } from '../audit/audit.service';

const ACTIVE_HOSTEL_BOOKING_STATUSES = [
  'PENDING',
  'PAYMENT_PENDING',
  'HELD',
  'CONFIRMED',
] as const;

@Injectable()
export class ListingsService {
  constructor(
    private prisma: PrismaService,
    private locationsService: LocationsService,
    private readonly auditService: AuditService,
  ) {}

  async create(landlordId: string, dto: CreateListingDto) {
    await this.assertLandlord(landlordId);
    this.validateHostelPayload(dto);
    const location = await this.locationsService.resolveLocationPath({
      country: dto.country,
      province: dto.province,
      city: dto.city,
      area: dto.area,
      blockSector: dto.blockSector,
    });

    const listing = await this.prisma.listing.create({
      data: {
        title: dto.title,
        description: dto.description,
        rules: dto.rules,
        address: dto.address,
        city: dto.city,
        area: dto.area,
        rent: dto.rent,
        deposit: dto.deposit,
        rentalDuration: dto.rentalDuration ?? RentalDuration.MONTHLY,
        availableFrom: dto.availableFrom ? new Date(dto.availableFrom) : null,
        latitude: dto.latitude,
        longitude: dto.longitude,
        sqft: dto.sqft,
        type: dto.propertyType,
        bedrooms: dto.bedrooms,
        bathrooms: dto.bathrooms,
        unitCount: dto.unitCount ?? 1,
        roomCount: dto.roomCount ?? dto.bedrooms,
        furnishedStatus: dto.furnishedStatus ?? FurnishedStatus.UNFURNISHED,
        availability: dto.availability ?? ListingAvailability.AVAILABLE,
        status: ListingStatus.PENDING,
        publicationStatus: ListingPublicationStatus.UNPUBLISHED,
        landlordId,
        locationId: location.id,
      },
    });

    if (dto.imageUrl) {
      await this.prisma.propertyImage.create({
        data: { listingId: listing.id, url: dto.imageUrl, isPrimary: true },
      });
    }

    if (dto.imageUrls?.length) {
      await this.prisma.propertyImage.createMany({
        data: dto.imageUrls.map((url, index) => ({
          listingId: listing.id,
          url,
          sortOrder: index + (dto.imageUrl ? 1 : 0),
          isPrimary: !dto.imageUrl && index === 0,
        })),
      });
    }

    if (dto.amenities?.length) {
      await this.setAmenities(listing.id, landlordId, {
        amenities: dto.amenities,
      });
    }

    if (dto.hostel) {
      const hostel = dto.hostel;
      await this.prisma.$transaction(async (transaction) => {
        await transaction.hostelDetails.create({
          data: {
            listingId: listing.id,
            buildingName: hostel.buildingName,
            genderPolicy: hostel.genderPolicy,
            bedCapacity: hostel.bedCapacity,
            availableBeds: hostel.availableBeds,
            messIncluded: hostel.messIncluded ?? false,
            wifiIncluded: hostel.wifiIncluded ?? false,
            laundryIncluded: hostel.laundryIncluded ?? false,
            electricityIncluded: hostel.electricityIncluded ?? false,
            securityIncluded: hostel.securityIncluded ?? false,
          },
        });

        for (const roomDto of hostel.rooms) {
          const room = await transaction.hostelRoom.create({
            data: {
              listingId: listing.id,
              roomNumber: roomDto.roomNumber.trim(),
              roomType: roomDto.roomType?.trim() || 'STANDARD',
              capacity: roomDto.capacity,
              availableBeds: roomDto.availableBeds,
              genderPolicy: roomDto.genderPolicy,
              price: roomDto.price ?? Math.round(dto.rent),
            },
          });
          await transaction.hostelBed.createMany({
            data: Array.from({ length: room.capacity }, (_, index) => ({
              hostelRoomId: room.id,
              bedNumber: String(index + 1),
              status:
                index < roomDto.availableBeds
                  ? HostelBedStatus.AVAILABLE
                  : HostelBedStatus.OCCUPIED,
            })),
          });
        }
      });
    }

    return this.findById(listing.id);
  }

  async findAll(query: ListingQueryDto = new ListingQueryDto()) {
    const where: Prisma.ListingWhereInput = {
      publicationStatus:
        query.publicationStatus ?? ListingPublicationStatus.PUBLISHED,
    };

    if (query.city) where.city = { contains: query.city, mode: 'insensitive' };
    if (query.area) where.area = { contains: query.area, mode: 'insensitive' };
    if (query.hostel?.trim()) {
      where.OR = [
        { title: { contains: query.hostel.trim(), mode: 'insensitive' } },
        {
          hostelDetails: {
            buildingName: {
              contains: query.hostel.trim(),
              mode: 'insensitive',
            },
          },
        },
      ];
    }
    if (
      query.country ||
      query.province ||
      query.city ||
      query.area ||
      query.blockSector
    ) {
      const locationIds = await this.locationsService.findDescendantIds({
        COUNTRY: query.country,
        PROVINCE: query.province,
        CITY: query.city,
        AREA: query.area,
        BLOCK_SECTOR: query.blockSector,
      });
      where.locationId = { in: locationIds };
    }
    if (query.propertyType) where.type = query.propertyType;
    if (query.furnishedStatus) where.furnishedStatus = query.furnishedStatus;
    if (query.availability) where.availability = query.availability;
    if (query.rentalDuration) where.rentalDuration = query.rentalDuration;
    if (query.availableFrom)
      where.availableFrom = { lte: new Date(query.availableFrom) };
    const roomFilter: Prisma.HostelRoomWhereInput = {};
    if (query.gender) {
      roomFilter.OR = [
        { genderPolicy: query.gender },
        { genderPolicy: 'MIXED' },
        {
          genderPolicy: null,
          listing: {
            hostelDetails: {
              genderPolicy: { in: [query.gender, 'MIXED'] },
            },
          },
        },
      ];
    }
    if (query.roomType) {
      roomFilter.roomType = {
        contains: query.roomType.trim(),
        mode: 'insensitive',
      };
    }
    if (query.sharingCapacity !== undefined) {
      roomFilter.capacity = query.sharingCapacity;
    }
    if (query.availableBeds !== undefined) {
      roomFilter.availableBeds = { gte: query.availableBeds };
    }
    if (query.minBedPrice !== undefined || query.maxBedPrice !== undefined) {
      roomFilter.price = { gte: query.minBedPrice, lte: query.maxBedPrice };
    }
    if (Object.keys(roomFilter).length) {
      where.hostelRooms = { some: roomFilter };
    }
    if (query.amenities?.length) {
      where.amenities = {
        some: {
          amenity: { name: { in: query.amenities, mode: 'insensitive' } },
        },
      };
    }
    if (query.bedrooms !== undefined) where.bedrooms = query.bedrooms;
    if (query.bathrooms !== undefined) where.bathrooms = query.bathrooms;
    if (query.minRent !== undefined || query.maxRent !== undefined) {
      where.rent = { gte: query.minRent, lte: query.maxRent };
    }

    const skip = (query.page - 1) * query.limit;
    const orderBy = {
      [query.sortBy ?? ListingSortBy.CREATED_AT]:
        query.sortOrder ?? SortOrder.DESC,
    } as Prisma.ListingOrderByWithRelationInput;

    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take: query.limit,
        orderBy,
        include: this.listingInclude(),
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      items: items.map((listing) => this.withRentraVerified(listing)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findById(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: this.listingInclude(),
    });
    if (!listing) throw new NotFoundException('Listing not found');
    return this.withRentraVerified(listing);
  }

  async findPublicById(id: string, viewerId?: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: this.listingInclude(),
    });
    if (
      !listing ||
      (listing.publicationStatus !== ListingPublicationStatus.PUBLISHED &&
        listing.landlordId !== viewerId)
    ) {
      throw new NotFoundException('Listing not found');
    }
    return this.withRentraVerified(listing);
  }

  async recordView(listingId: string, sessionId?: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true },
    });
    if (!listing) throw new NotFoundException('Listing not found');

    if (sessionId) {
      const recentView = await this.prisma.propertyView.findFirst({
        where: {
          listingId,
          sessionId,
          viewedAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
        },
      });
      if (recentView) return recentView;
    }

    return this.prisma.propertyView.create({ data: { listingId, sessionId } });
  }

  async update(id: string, landlordId: string, dto: UpdateListingDto) {
    const current = await this.assertOwner(id, landlordId);
    const materialDetailsChanged = [
      dto.title,
      dto.description,
      dto.address,
      dto.city,
      dto.area,
      dto.latitude,
      dto.longitude,
      dto.sqft,
      dto.propertyType,
    ].some((value) => value !== undefined);
    const data: Prisma.ListingUpdateInput = {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.rules !== undefined && { rules: dto.rules }),
      ...(dto.address !== undefined && { address: dto.address }),
      ...(dto.city !== undefined && { city: dto.city }),
      ...(dto.area !== undefined && { area: dto.area }),
      ...(dto.rent !== undefined && { rent: dto.rent }),
      ...(dto.deposit !== undefined && { deposit: dto.deposit }),
      ...(dto.rentalDuration !== undefined && {
        rentalDuration: dto.rentalDuration,
      }),
      ...(dto.availableFrom !== undefined && {
        availableFrom: new Date(dto.availableFrom),
      }),
      ...(dto.latitude !== undefined && { latitude: dto.latitude }),
      ...(dto.longitude !== undefined && { longitude: dto.longitude }),
      ...(dto.sqft !== undefined && { sqft: dto.sqft }),
      ...(dto.propertyType !== undefined && { type: dto.propertyType }),
      ...(dto.bedrooms !== undefined && { bedrooms: dto.bedrooms }),
      ...(dto.bathrooms !== undefined && { bathrooms: dto.bathrooms }),
      ...(dto.unitCount !== undefined && { unitCount: dto.unitCount }),
      ...(dto.roomCount !== undefined && { roomCount: dto.roomCount }),
      ...(dto.furnishedStatus !== undefined && {
        furnishedStatus: dto.furnishedStatus,
      }),
      ...(dto.availability !== undefined && { availability: dto.availability }),
    };

    const listing = await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.listing.update({
        where: { id },
        data,
      });
      if (materialDetailsChanged && current.propertyId) {
        const invalidated = await transaction.property.updateMany({
          where: {
            id: current.propertyId,
            verificationStatus: VerificationStatus.APPROVED,
          },
          data: { verificationStatus: VerificationStatus.UNVERIFIED },
        });
        if (invalidated.count === 1) {
          await this.auditService.record(transaction, {
            actorId: landlordId,
            actorRole: 'LANDLORD',
            entityType: 'PROPERTY',
            entityId: current.propertyId,
            action: 'PROPERTY_VERIFICATION_INVALIDATED_BY_UPDATE',
            previousStatus: VerificationStatus.APPROVED,
            newStatus: VerificationStatus.UNVERIFIED,
            reason: 'Material property details changed',
          });
        }
      }
      return updated;
    });
    if (dto.imageUrl) {
      await this.prisma.propertyImage.create({
        data: { listingId: id, url: dto.imageUrl },
      });
    }
    return this.findById(listing.id);
  }

  async delete(id: string, landlordId: string) {
    await this.assertOwner(id, landlordId);
    return this.prisma.listing.delete({ where: { id } });
  }

  async publish(id: string, landlordId: string) {
    await this.assertOwner(id, landlordId);
    return this.prisma.listing.update({
      where: { id },
      data: { publicationStatus: ListingPublicationStatus.PUBLISHED },
    });
  }

  async unpublish(id: string, landlordId: string) {
    await this.assertOwner(id, landlordId);
    return this.prisma.listing.update({
      where: { id },
      data: { publicationStatus: ListingPublicationStatus.UNPUBLISHED },
    });
  }

  async setAvailability(
    id: string,
    landlordId: string,
    availability: ListingAvailability,
  ) {
    await this.assertOwner(id, landlordId);
    return this.prisma.listing.update({
      where: { id },
      data: { availability },
    });
  }

  async updateHostelBedStatus(
    listingId: string,
    bedId: string,
    landlordId: string,
    dto: UpdateHostelBedStatusDto,
  ) {
    const listing = await this.assertOwner(listingId, landlordId);
    if (listing.type !== 'HOSTEL') {
      throw new BadRequestException(
        'Bed inventory is only available for hostels',
      );
    }

    return this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw(Prisma.sql`
        SELECT pg_advisory_xact_lock(hashtext(${listing.propertyId ?? listingId}))
      `);
      const bed = await transaction.hostelBed.findFirst({
        where: { id: bedId, room: { listingId } },
        select: { id: true, status: true, hostelRoomId: true },
      });
      if (!bed) throw new NotFoundException('Hostel bed not found');

      if (
        dto.status === HostelBedStatus.AVAILABLE ||
        dto.status === HostelBedStatus.MAINTENANCE
      ) {
        const activeBooking = await transaction.booking.findFirst({
          where: {
            hostelBedId: bedId,
            status: { in: [...ACTIVE_HOSTEL_BOOKING_STATUSES] },
            endDate: { gt: new Date() },
          },
          select: { id: true },
        });
        if (activeBooking) {
          throw new BadRequestException(
            'A bed with an active booking cannot be made available or placed in maintenance',
          );
        }
      }

      const updatedBed = await transaction.hostelBed.update({
        where: { id: bedId },
        data: { status: dto.status },
        include: { room: true },
      });
      const availableBeds = await transaction.hostelBed.count({
        where: {
          hostelRoomId: bed.hostelRoomId,
          status: HostelBedStatus.AVAILABLE,
        },
      });
      await transaction.hostelRoom.update({
        where: { id: bed.hostelRoomId },
        data: { availableBeds },
      });
      const inventory = await transaction.hostelRoom.aggregate({
        where: { listingId },
        _sum: { availableBeds: true },
      });
      await transaction.hostelDetails.updateMany({
        where: { listingId },
        data: { availableBeds: inventory._sum.availableBeds ?? 0 },
      });
      return updatedBed;
    });
  }

  async getByLandlord(landlordId: string, query: ListingQueryDto) {
    const where: Prisma.ListingWhereInput = { landlordId };
    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: {
          [query.sortBy ?? ListingSortBy.CREATED_AT]:
            query.sortOrder ?? SortOrder.DESC,
        },
        include: this.listingInclude(),
      }),
      this.prisma.listing.count({ where }),
    ]);
    return {
      items: items.map((listing) => this.withRentraVerified(listing)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getLandlordAnalytics(landlordId: string) {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const listings = await this.prisma.listing.findMany({
      where: { landlordId },
      select: { id: true },
    });
    const listingIds = listings.map((listing) => listing.id);
    const [viewsThisMonth, favorites, requests] = await Promise.all([
      this.prisma.propertyView.count({
        where: { listingId: { in: listingIds }, viewedAt: { gte: monthStart } },
      }),
      this.prisma.favorite.count({ where: { listingId: { in: listingIds } } }),
      this.prisma.rentalRequest.count({
        where: { listingId: { in: listingIds } },
      }),
    ]);
    return { viewsThisMonth, favorites, requests };
  }

  async addImage(id: string, landlordId: string, dto: PropertyImageDto) {
    await this.assertOwner(id, landlordId);
    return this.prisma.propertyImage.create({
      data: {
        listingId: id,
        url: dto.url,
        publicId: dto.publicId,
        altText: dto.altText,
        sortOrder: dto.sortOrder,
      },
    });
  }

  async removeImage(listingId: string, imageId: string, landlordId: string) {
    await this.assertOwner(listingId, landlordId);
    const image = await this.prisma.propertyImage.findFirst({
      where: { id: imageId, listingId },
    });
    if (!image) throw new NotFoundException('Property image not found');
    return this.prisma.propertyImage.delete({ where: { id: imageId } });
  }

  async setAmenities(id: string, landlordId: string, dto: AmenitiesDto) {
    await this.assertOwner(id, landlordId);
    const names = [
      ...new Set(dto.amenities.map((name) => name.trim()).filter(Boolean)),
    ];
    return this.prisma.$transaction(async (transaction) => {
      await transaction.propertyAmenity.deleteMany({
        where: { listingId: id },
      });
      for (const name of names) {
        const amenity = await transaction.amenity.upsert({
          where: { name },
          create: { name },
          update: {},
        });
        await transaction.propertyAmenity.create({
          data: { listingId: id, amenityId: amenity.id },
        });
      }
      const listing = await transaction.listing.findUnique({
        where: { id },
        include: this.listingInclude(),
      });
      return listing ? this.withRentraVerified(listing) : null;
    });
  }

  private async assertLandlord(userId: string) {
    const profile = await this.prisma.landlordProfile.findUnique({
      where: { userId },
    });
    if (!profile)
      throw new ForbiddenException(
        'Create a landlord profile before managing properties',
      );
  }

  private async assertOwner(id: string, landlordId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.landlordId !== landlordId)
      throw new ForbiddenException('You can only manage your own properties');
    return listing;
  }

  private listingInclude() {
    return {
      landlord: {
        select: {
          id: true,
          fullName: true,
          isVerified: true,
          trustScore: true,
        },
      },
      property: {
        select: { id: true, status: true, verificationStatus: true },
      },
      images: { orderBy: { sortOrder: 'asc' as const } },
      amenities: { include: { amenity: true } },
      location: {
        include: {
          parent: {
            include: {
              parent: { include: { parent: { include: { parent: true } } } },
            },
          },
        },
      },
      hostelDetails: true,
      hostelRooms: {
        orderBy: { roomNumber: 'asc' as const },
        include: { beds: { orderBy: { bedNumber: 'asc' as const } } },
      },
      _count: {
        select: { propertyViews: true, favorites: true, rentalRequests: true },
      },
    };
  }

  private withRentraVerified<
    T extends { property: { verificationStatus: VerificationStatus } | null },
  >(listing: T) {
    return {
      ...listing,
      isRentraVerified:
        listing.property?.verificationStatus === VerificationStatus.APPROVED,
    };
  }

  private validateHostelPayload(dto: CreateListingDto) {
    if (dto.propertyType !== 'HOSTEL') {
      if (dto.hostel)
        throw new BadRequestException(
          'Hostel details are only valid for HOSTEL listings',
        );
      return;
    }

    const hostel = dto.hostel;
    if (!hostel)
      throw new BadRequestException(
        'Hostel details are required for hostel listings',
      );

    const roomCapacity = hostel.rooms.reduce(
      (total, room) => total + room.capacity,
      0,
    );
    const availableBeds = hostel.rooms.reduce(
      (total, room) => total + room.availableBeds,
      0,
    );
    if (
      hostel.rooms.some(
        (room) =>
          room.availableBeds > room.capacity ||
          (room.price !== undefined && !Number.isSafeInteger(room.price)),
      )
    ) {
      throw new BadRequestException(
        'Each room availableBeds must not exceed capacity and bed prices must be whole numbers',
      );
    }
    if (
      roomCapacity !== hostel.bedCapacity ||
      availableBeds !== hostel.availableBeds
    ) {
      throw new BadRequestException(
        'Hostel bed totals must match the room inventory',
      );
    }
    if (hostel.availableBeds > hostel.bedCapacity) {
      throw new BadRequestException(
        'Available beds cannot exceed bed capacity',
      );
    }
  }
}
