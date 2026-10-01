import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FurnishedStatus,
  ListingAvailability,
  ListingStatus,
  ListingPublicationStatus,
  LocationLevel,
  Prisma,
  RentalDuration,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AmenitiesDto } from './dto/amenities.dto';
import { CreateListingDto } from './dto/create-listing.dto';
import { CreateHostelDto } from './dto/create-hostel.dto';
import { ListingQueryDto, ListingSortBy, SortOrder } from './dto/listing-query.dto';
import { PropertyImageDto } from './dto/property-image.dto';
import { UpdateListingDto } from './dto/update-listing.dto';

@Injectable()
export class ListingsService {
  constructor(private prisma: PrismaService) {}

  async create(landlordId: string, dto: CreateListingDto) {
    await this.assertLandlord(landlordId);
    this.validateHostelPayload(dto);
    const locationId = await this.resolveLocationId(dto);

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
        locationId,
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
      await this.setAmenities(listing.id, landlordId, { amenities: dto.amenities });
    }

    if (dto.hostel) {
      await this.prisma.hostelDetails.create({
        data: {
          listingId: listing.id,
          buildingName: dto.hostel.buildingName,
          genderPolicy: dto.hostel.genderPolicy,
          bedCapacity: dto.hostel.bedCapacity,
          availableBeds: dto.hostel.availableBeds,
          messIncluded: dto.hostel.messIncluded ?? false,
          wifiIncluded: dto.hostel.wifiIncluded ?? false,
          laundryIncluded: dto.hostel.laundryIncluded ?? false,
          electricityIncluded: dto.hostel.electricityIncluded ?? false,
          securityIncluded: dto.hostel.securityIncluded ?? false,
        },
      });
      await this.prisma.hostelRoom.createMany({
        data: dto.hostel.rooms.map((room) => ({ listingId: listing.id, ...room })),
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
    if (query.country || query.province || query.blockSector) {
      const locationIds = await this.findLocationDescendantIds(query);
      where.locationId = { in: locationIds };
    }
    if (query.propertyType) where.type = query.propertyType;
    if (query.furnishedStatus) where.furnishedStatus = query.furnishedStatus;
    if (query.availability) where.availability = query.availability;
    if (query.rentalDuration) where.rentalDuration = query.rentalDuration;
    if (query.availableFrom) where.availableFrom = { lte: new Date(query.availableFrom) };
    if (query.gender) where.hostelDetails = { genderPolicy: query.gender };
    if (query.amenities?.length) {
      where.amenities = {
        some: { amenity: { name: { in: query.amenities, mode: 'insensitive' } } },
      };
    }
    if (query.bedrooms !== undefined) where.bedrooms = query.bedrooms;
    if (query.bathrooms !== undefined) where.bathrooms = query.bathrooms;
    if (query.minRent !== undefined || query.maxRent !== undefined) {
      where.rent = { gte: query.minRent, lte: query.maxRent };
    }

    const skip = (query.page - 1) * query.limit;
    const orderBy = {
      [query.sortBy ?? ListingSortBy.CREATED_AT]: query.sortOrder ?? SortOrder.DESC,
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
      items,
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
    return listing;
  }

  async recordView(listingId: string, sessionId?: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId }, select: { id: true } });
    if (!listing) throw new NotFoundException('Listing not found');

    if (sessionId) {
      const recentView = await this.prisma.propertyView.findFirst({
        where: { listingId, sessionId, viewedAt: { gte: new Date(Date.now() - 30 * 60 * 1000) } },
      });
      if (recentView) return recentView;
    }

    return this.prisma.propertyView.create({ data: { listingId, sessionId } });
  }

  async update(id: string, landlordId: string, dto: UpdateListingDto) {
    await this.assertOwner(id, landlordId);
    const data: Prisma.ListingUpdateInput = {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.rules !== undefined && { rules: dto.rules }),
      ...(dto.address !== undefined && { address: dto.address }),
      ...(dto.city !== undefined && { city: dto.city }),
      ...(dto.area !== undefined && { area: dto.area }),
      ...(dto.rent !== undefined && { rent: dto.rent }),
      ...(dto.deposit !== undefined && { deposit: dto.deposit }),
      ...(dto.rentalDuration !== undefined && { rentalDuration: dto.rentalDuration }),
      ...(dto.availableFrom !== undefined && { availableFrom: new Date(dto.availableFrom) }),
      ...(dto.latitude !== undefined && { latitude: dto.latitude }),
      ...(dto.longitude !== undefined && { longitude: dto.longitude }),
      ...(dto.sqft !== undefined && { sqft: dto.sqft }),
      ...(dto.propertyType !== undefined && { type: dto.propertyType }),
      ...(dto.bedrooms !== undefined && { bedrooms: dto.bedrooms }),
      ...(dto.bathrooms !== undefined && { bathrooms: dto.bathrooms }),
      ...(dto.unitCount !== undefined && { unitCount: dto.unitCount }),
      ...(dto.roomCount !== undefined && { roomCount: dto.roomCount }),
      ...(dto.furnishedStatus !== undefined && { furnishedStatus: dto.furnishedStatus }),
      ...(dto.availability !== undefined && { availability: dto.availability }),
    };

    const listing = await this.prisma.listing.update({ where: { id }, data });
    if (dto.imageUrl) {
      await this.prisma.propertyImage.create({ data: { listingId: id, url: dto.imageUrl } });
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

  async setAvailability(id: string, landlordId: string, availability: ListingAvailability) {
    await this.assertOwner(id, landlordId);
    return this.prisma.listing.update({ where: { id }, data: { availability } });
  }

  async getByLandlord(landlordId: string, query: ListingQueryDto) {
    const where: Prisma.ListingWhereInput = { landlordId };
    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { [query.sortBy ?? ListingSortBy.CREATED_AT]: query.sortOrder ?? SortOrder.DESC },
        include: this.listingInclude(),
      }),
      this.prisma.listing.count({ where }),
    ]);
    return { items, pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
  }

  async getLandlordAnalytics(landlordId: string) {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const listings = await this.prisma.listing.findMany({ where: { landlordId }, select: { id: true } });
    const listingIds = listings.map((listing) => listing.id);
    const [viewsThisMonth, favorites, requests] = await Promise.all([
      this.prisma.propertyView.count({ where: { listingId: { in: listingIds }, viewedAt: { gte: monthStart } } }),
      this.prisma.favorite.count({ where: { listingId: { in: listingIds } } }),
      this.prisma.rentalRequest.count({ where: { listingId: { in: listingIds } } }),
    ]);
    return { viewsThisMonth, favorites, requests };
  }

  async addImage(id: string, landlordId: string, dto: PropertyImageDto) {
    await this.assertOwner(id, landlordId);
    return this.prisma.propertyImage.create({
      data: { listingId: id, url: dto.url, publicId: dto.publicId, altText: dto.altText, sortOrder: dto.sortOrder },
    });
  }

  async removeImage(listingId: string, imageId: string, landlordId: string) {
    await this.assertOwner(listingId, landlordId);
    const image = await this.prisma.propertyImage.findFirst({ where: { id: imageId, listingId } });
    if (!image) throw new NotFoundException('Property image not found');
    return this.prisma.propertyImage.delete({ where: { id: imageId } });
  }

  async setAmenities(id: string, landlordId: string, dto: AmenitiesDto) {
    await this.assertOwner(id, landlordId);
    const names = [...new Set(dto.amenities.map((name) => name.trim()).filter(Boolean))];
    return this.prisma.$transaction(async (transaction) => {
      await transaction.propertyAmenity.deleteMany({ where: { listingId: id } });
      for (const name of names) {
        const amenity = await transaction.amenity.upsert({ where: { name }, create: { name }, update: {} });
        await transaction.propertyAmenity.create({ data: { listingId: id, amenityId: amenity.id } });
      }
      return transaction.listing.findUnique({ where: { id }, include: this.listingInclude() });
    });
  }

  private async assertLandlord(userId: string) {
    const profile = await this.prisma.landlordProfile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException('Create a landlord profile before managing properties');
  }

  private async assertOwner(id: string, landlordId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.landlordId !== landlordId) throw new ForbiddenException('You can only manage your own properties');
    return listing;
  }

  private listingInclude() {
    return {
      landlord: { select: { id: true, fullName: true, email: true, phone: true, cnic: true, isVerified: true, trustScore: true } },
      images: { orderBy: { sortOrder: 'asc' as const } },
      amenities: { include: { amenity: true } },
      location: { include: { parent: { include: { parent: { include: { parent: { include: { parent: true } } } } } } } },
      hostelDetails: true,
      hostelRooms: { orderBy: { roomNumber: 'asc' as const } },
      _count: { select: { propertyViews: true, favorites: true, rentalRequests: true } },
    };
  }

  private async resolveLocationId(dto: CreateListingDto) {
    const country = await this.findOrCreateLocation(dto.country ?? 'Pakistan', LocationLevel.COUNTRY);
    const province = await this.findOrCreateLocation(dto.province ?? 'Unknown', LocationLevel.PROVINCE, country.id);
    const city = await this.findOrCreateLocation(dto.city, LocationLevel.CITY, province.id);
    const area = await this.findOrCreateLocation(dto.area, LocationLevel.AREA, city.id);
    const block = dto.blockSector
      ? await this.findOrCreateLocation(dto.blockSector, LocationLevel.BLOCK_SECTOR, area.id)
      : area;
    return block.id;
  }

  private async findLocationDescendantIds(query: ListingQueryDto) {
    const levelFilters = [
      { level: LocationLevel.COUNTRY, name: query.country },
      { level: LocationLevel.PROVINCE, name: query.province },
      { level: LocationLevel.BLOCK_SECTOR, name: query.blockSector },
    ].filter((filter) => filter.name);

    if (levelFilters.length === 0) return [];

    const locations = await this.prisma.location.findMany({
      select: { id: true, parentId: true, level: true, name: true },
    });
    const descendantsOf = (rootIds: Set<string>) => {
      const ids = new Set(rootIds);
      let frontier = [...rootIds];
      while (frontier.length > 0) {
        const children = locations.filter((location) => location.parentId && frontier.includes(location.parentId));
        frontier = children.map((child) => child.id).filter((id) => !ids.has(id));
        frontier.forEach((id) => ids.add(id));
      }
      return ids;
    };

    const matchingSets = levelFilters.map((filter) => descendantsOf(new Set(
      locations
        .filter((location) => location.level === filter.level && location.name.toLowerCase().includes(filter.name!.toLowerCase()))
        .map((location) => location.id),
    )));
    if (matchingSets.some((ids) => ids.size === 0)) return ['__no_location_match__'];
    return [...matchingSets.slice(1).reduce((intersection, ids) => new Set([...intersection].filter((id) => ids.has(id))), matchingSets[0])];
  }

  private async findOrCreateLocation(name: string, level: LocationLevel, parentId?: string) {
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const existing = await this.prisma.location.findFirst({ where: { slug, level, parentId } });
    return existing ?? this.prisma.location.create({ data: { name: name.trim(), slug, level, parentId } });
  }

  private validateHostelPayload(dto: CreateListingDto) {
    if (dto.propertyType !== 'HOSTEL') {
      if (dto.hostel) throw new BadRequestException('Hostel details are only valid for HOSTEL listings');
      return;
    }

    const hostel = dto.hostel as CreateHostelDto | undefined;
    if (!hostel) throw new BadRequestException('Hostel details are required for hostel listings');

    const roomCapacity = hostel.rooms.reduce((total, room) => total + room.capacity, 0);
    const availableBeds = hostel.rooms.reduce((total, room) => total + room.availableBeds, 0);
    if (roomCapacity !== hostel.bedCapacity || availableBeds !== hostel.availableBeds) {
      throw new BadRequestException('Hostel bed totals must match the room inventory');
    }
    if (hostel.availableBeds > hostel.bedCapacity) {
      throw new BadRequestException('Available beds cannot exceed bed capacity');
    }
  }
}
