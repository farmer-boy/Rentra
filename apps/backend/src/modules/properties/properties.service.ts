import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHmac } from 'crypto';
import {
  FurnishedStatus,
  ListingAvailability,
  ListingPublicationStatus,
  ListingStatus,
  Prisma,
  PropertyStatus,
  Role,
  RentalDuration,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UploadService, ImageUploadFile } from '../listings/upload.service';
import { LocationsService } from '../locations/locations.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { PropertyQueryDto } from './dto/property-query.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { UpdatePropertyImageDto } from './dto/update-property-image.dto';
import {
  PropertySearchDto,
  PropertySearchSort,
} from './dto/property-search.dto';
import { PropertyStatsQueryDto } from './dto/property-stats-query.dto';
import { NearbyPropertiesDto } from './dto/nearby-properties.dto';

const EARTH_RADIUS_KM = 6371.0088;

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly locationsService: LocationsService,
    private readonly uploadService: UploadService,
  ) {}

  async create(ownerId: string, dto: CreatePropertyDto) {
    this.validateCoordinates(dto.latitude, dto.longitude);
    const location = await this.locationsService.resolveLocationPath({
      country: dto.country,
      province: dto.province,
      city: dto.city,
      area: dto.area,
      blockSector: dto.blockSector,
    });
    const status = PropertyStatus.PENDING_VERIFICATION;
    const listingStatus = this.toListingStatus(status);

    return this.prisma.property.create({
      data: {
        ownerId,
        title: dto.title.trim(),
        description: dto.description,
        propertyType: dto.type,
        rentalMode: dto.rentalMode,
        price: dto.price,
        securityDeposit: dto.securityDeposit,
        bedrooms: dto.bedrooms,
        bathrooms: dto.bathrooms,
        areaSizeSqft: dto.areaSizeSqft,
        furnishedStatus: dto.furnishedStatus ?? FurnishedStatus.UNFURNISHED,
        availability: dto.availability ?? ListingAvailability.AVAILABLE,
        rules: dto.rules,
        status,
        country: dto.country.trim(),
        city: dto.city.trim(),
        area: dto.area.trim(),
        address: dto.address.trim(),
        latitude: dto.latitude,
        longitude: dto.longitude,
        locationId: location.id,
        listings: {
          create: {
            title: dto.title.trim(),
            description: dto.description ?? '',
            rules: dto.rules,
            area: dto.area.trim(),
            city: dto.city.trim(),
            address: dto.address.trim(),
            type: dto.type,
            bedrooms: dto.bedrooms,
            bathrooms: dto.bathrooms,
            unitCount: 1,
            roomCount: dto.bedrooms,
            sqft: dto.areaSizeSqft ?? 0,
            rent: dto.price,
            deposit: dto.securityDeposit,
            rentalDuration: dto.rentalMode,
            listingMode: this.toListingMode(dto.rentalMode),
            latitude: dto.latitude,
            longitude: dto.longitude,
            status: listingStatus,
            publicationStatus: this.toPublicationStatus(status),
            availability: dto.availability ?? ListingAvailability.AVAILABLE,
            furnishedStatus: dto.furnishedStatus ?? FurnishedStatus.UNFURNISHED,
            landlordId: ownerId,
            locationId: location.id,
          },
        },
      },
      include: this.propertyInclude(),
    });
  }

  async findAll(query: PropertyQueryDto, requesterId?: string) {
    const accessFilter: Prisma.PropertyWhereInput = requesterId
      ? {
          OR: [
            { status: PropertyStatus.ACTIVE },
            { ownerId: requesterId },
            { managers: { some: { userId: requesterId } } },
          ],
        }
      : { status: PropertyStatus.ACTIVE };

    const where: Prisma.PropertyWhereInput = {
      ...accessFilter,
      ...(query.type && { propertyType: query.type }),
      ...(query.rentalMode && { rentalMode: query.rentalMode }),
      ...(query.furnishedStatus && { furnishedStatus: query.furnishedStatus }),
      ...(query.city && {
        city: { contains: query.city, mode: 'insensitive' },
      }),
      ...(query.area && {
        area: { contains: query.area, mode: 'insensitive' },
      }),
      ...(query.locationId && { locationId: query.locationId }),
      ...((query.minPrice !== undefined || query.maxPrice !== undefined) && {
        price: { gte: query.minPrice, lte: query.maxPrice },
      }),
    };

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: this.propertyInclude(),
      }),
      this.prisma.property.count({ where }),
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

  async search(query: PropertySearchDto) {
    if (
      query.minPrice !== undefined &&
      query.maxPrice !== undefined &&
      query.minPrice > query.maxPrice
    ) {
      throw new BadRequestException('minPrice cannot be greater than maxPrice');
    }
    const hasLatitude = query.latitude !== undefined;
    const hasLongitude = query.longitude !== undefined;
    const hasRadius = query.radiusKm !== undefined;
    if (hasLatitude !== hasLongitude || hasLatitude !== hasRadius) {
      throw new BadRequestException(
        'Nearby search requires latitude, longitude, and radiusKm together',
      );
    }

    const where: Prisma.PropertyWhereInput = {
      status: PropertyStatus.ACTIVE,
      ...(query.type && { propertyType: query.type }),
      ...(query.rentalMode && { rentalMode: query.rentalMode }),
      ...(query.furnishedStatus && { furnishedStatus: query.furnishedStatus }),
      ...(query.availability && { availability: query.availability }),
      ...(query.bedrooms !== undefined && { bedrooms: query.bedrooms }),
      ...(query.bathrooms !== undefined && { bathrooms: query.bathrooms }),
      ...((query.minPrice !== undefined || query.maxPrice !== undefined) && {
        price: { gte: query.minPrice, lte: query.maxPrice },
      }),
      ...(query.keyword?.trim() && {
        OR: [
          { title: { contains: query.keyword.trim(), mode: 'insensitive' } },
          {
            description: {
              contains: query.keyword.trim(),
              mode: 'insensitive',
            },
          },
          { address: { contains: query.keyword.trim(), mode: 'insensitive' } },
          { city: { contains: query.keyword.trim(), mode: 'insensitive' } },
          { area: { contains: query.keyword.trim(), mode: 'insensitive' } },
        ],
      }),
    };

    const locationIds = await this.locationsService.findDescendantIds({
      CITY: query.city,
      AREA: query.area,
      BLOCK_SECTOR: query.subArea,
    });
    if (query.city || query.area || query.subArea) {
      where.locationId = { in: locationIds };
    }

    if (query.amenities?.length) {
      where.AND = query.amenities.map((name) => ({
        amenities: {
          some: {
            amenity: { name: { equals: name, mode: 'insensitive' } },
          },
        },
      }));
    }

    let distanceById = new Map<string, number>();
    if (hasLatitude && hasLongitude && query.radiusKm !== undefined) {
      const latitude = query.latitude!;
      const longitude = query.longitude!;
      const radiusKm = query.radiusKm;
      const latitudeDelta = radiusKm / 110.574;
      const rawLongitudeDelta =
        radiusKm /
        (111.32 *
          Math.max(Math.abs(Math.cos((latitude * Math.PI) / 180)), 0.01));
      const longitudeBounds =
        rawLongitudeDelta >= 180
          ? Prisma.sql`TRUE`
          : longitude - rawLongitudeDelta < -180
            ? Prisma.sql`(
                "longitude" >= ${longitude - rawLongitudeDelta + 360}
                OR "longitude" <= ${longitude + rawLongitudeDelta}
              )`
            : longitude + rawLongitudeDelta > 180
              ? Prisma.sql`(
                  "longitude" >= ${longitude - rawLongitudeDelta}
                  OR "longitude" <= ${longitude + rawLongitudeDelta - 360}
                )`
              : Prisma.sql`"longitude" BETWEEN ${longitude - rawLongitudeDelta} AND ${longitude + rawLongitudeDelta}`;
      const distanceExpression = Prisma.sql`
        2 * ${EARTH_RADIUS_KM} * ASIN(SQRT(
          POWER(SIN(RADIANS("latitude" - ${latitude}) / 2), 2) +
          COS(RADIANS(${latitude})) * COS(RADIANS("latitude")) *
          POWER(SIN(RADIANS("longitude" - ${longitude}) / 2), 2)
        ))
      `;
      const nearby = await this.prisma.$queryRaw<
        Array<{ id: string; distanceKm: number }>
      >(Prisma.sql`
        SELECT "id", ${distanceExpression} AS "distanceKm"
        FROM "Property"
        WHERE "status" = ${PropertyStatus.ACTIVE}::"PropertyStatus"
          AND "latitude" BETWEEN ${latitude - latitudeDelta} AND ${latitude + latitudeDelta}
          AND ${longitudeBounds}
          AND ${distanceExpression} <= ${radiusKm}
      `);
      distanceById = new Map(
        nearby.map((property) => [property.id, Number(property.distanceKm)]),
      );
      where.id = { in: nearby.map((property) => property.id) };
    }

    const orderBy: Prisma.PropertyOrderByWithRelationInput[] =
      this.searchOrderBy(query.sort);
    const skip = (query.page - 1) * query.limit;
    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: query.limit,
        orderBy,
        include: {
          ...this.propertyInclude(),
          _count: { select: { views: true, favorites: true } },
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    return {
      items: properties.map((property) => ({
        ...property,
        ...(distanceById.has(property.id) && {
          distanceKm: distanceById.get(property.id),
        }),
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
      filters: { ...query, status: PropertyStatus.ACTIVE },
    };
  }

  async findNearby(query: NearbyPropertiesDto) {
    if (
      query.minPrice !== undefined &&
      query.maxPrice !== undefined &&
      query.minPrice > query.maxPrice
    ) {
      throw new BadRequestException('minPrice cannot be greater than maxPrice');
    }

    const results = await this.search({
      ...query,
      radiusKm: query.radius,
      page: 1,
      limit: query.limit,
      sort: PropertySearchSort.RECOMMENDED,
    });
    const items = [...results.items].sort(
      (left, right) =>
        (left.distanceKm ?? Infinity) - (right.distanceKm ?? Infinity),
    );

    return {
      center: { latitude: query.latitude, longitude: query.longitude },
      radiusKm: query.radius,
      total: results.pagination.total,
      items,
      markers: items.map((property) => ({
        id: property.id,
        title: property.title,
        latitude: property.latitude,
        longitude: property.longitude,
        price: property.price,
        type: property.propertyType,
        distanceKm: property.distanceKm,
      })),
    };
  }

  async findById(id: string, requesterId?: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: this.propertyInclude(),
    });
    if (!property) throw new NotFoundException('Property not found');

    if (
      property.status !== PropertyStatus.ACTIVE &&
      (!requesterId || !(await this.canManage(property.id, requesterId)))
    ) {
      throw new NotFoundException('Property not found');
    }

    return property;
  }

  async recordView(
    propertyId: string,
    userId: string | undefined,
    clientSessionId: string | undefined,
    clientIp: string | undefined,
    userAgent: string | undefined,
  ) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, ownerId: true, status: true },
    });
    if (!property) throw new NotFoundException('Property not found');

    if (property.status !== PropertyStatus.ACTIVE) {
      if (!userId || !(await this.canManage(propertyId, userId))) {
        throw new NotFoundException('Property not found');
      }
    }
    if (
      userId &&
      (property.ownerId === userId ||
        (await this.canManage(propertyId, userId)))
    ) {
      return { tracked: false, reason: 'OWNER_OR_MANAGER_VIEW' };
    }

    const sessionId = this.hashViewIdentity(
      clientSessionId
        ? `browser:${clientSessionId}`
        : `anonymous:${clientIp ?? 'unknown'}:${userAgent ?? 'unknown'}`,
    );
    const identityKey = userId ? `user:${userId}` : `session:${sessionId}`;
    const now = new Date();
    const dedupeSince = new Date(now.getTime() - 30 * 60 * 1000);
    const listing = await this.prisma.listing.findFirst({
      where: { propertyId },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    return this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw(Prisma.sql`
        SELECT pg_advisory_xact_lock(hashtext(${propertyId}), hashtext(${identityKey}))
      `);

      const recentView = await transaction.propertyView.findFirst({
        where: {
          OR: [{ propertyId }, ...(listing ? [{ listingId: listing.id }] : [])],
          viewedAt: { gte: dedupeSince },
          ...(userId ? { userId } : { sessionId }),
        },
        select: { id: true, viewedAt: true },
      });
      if (recentView) {
        return {
          tracked: false,
          reason: 'DUPLICATE_VIEW',
          viewedAt: recentView.viewedAt,
        };
      }

      const view = await transaction.propertyView.create({
        data: {
          propertyId,
          listingId: listing?.id,
          userId: userId ?? null,
          sessionId,
          viewedAt: now,
        },
        select: { id: true, propertyId: true, viewedAt: true },
      });
      return { tracked: true, view };
    });
  }

  async getStats(
    propertyId: string,
    requesterId: string,
    query: PropertyStatsQueryDto,
  ) {
    await this.assertCanManage(propertyId, requesterId);
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, listings: { select: { id: true } } },
    });
    if (!property) throw new NotFoundException('Property not found');

    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - (query.days - 1));
    const listingIds = property.listings.map((listing) => listing.id);
    const favoriteTargets: Prisma.FavoriteWhereInput[] = [
      { propertyId },
      ...(listingIds.length ? [{ listingId: { in: listingIds } }] : []),
    ];
    const listingViewsClause = listingIds.length
      ? Prisma.sql`"listingId" IN (${Prisma.join(listingIds)})`
      : Prisma.sql`FALSE`;

    const [totalViews, dailyViews, favorites, rentalRequests, bookings] =
      await Promise.all([
        this.prisma.propertyView.count({
          where: {
            OR: [
              { propertyId },
              ...(listingIds.length ? [{ listingId: { in: listingIds } }] : []),
            ],
          },
        }),
        this.prisma.$queryRaw<Array<{ day: string; count: number }>>(Prisma.sql`
          SELECT TO_CHAR(
                   DATE_TRUNC('day', "viewedAt" AT TIME ZONE 'UTC'),
                   'YYYY-MM-DD'
                 ) AS "day",
                 COUNT(*)::int AS "count"
          FROM "PropertyView"
          WHERE (
            "propertyId" = ${propertyId}
            OR ${listingViewsClause}
          ) AND "viewedAt" >= ${since}
          GROUP BY DATE_TRUNC('day', "viewedAt" AT TIME ZONE 'UTC')
          ORDER BY DATE_TRUNC('day', "viewedAt" AT TIME ZONE 'UTC')
        `),
        this.prisma.favorite.findMany({
          where: { OR: favoriteTargets },
          select: { userId: true },
          distinct: ['userId'],
        }),
        this.prisma.rentalRequest.count({
          where: {
            OR: [
              { propertyId },
              ...(listingIds.length ? [{ listingId: { in: listingIds } }] : []),
            ],
          },
        }),
        this.prisma.booking.count({
          where: {
            OR: [
              { propertyId },
              ...(listingIds.length ? [{ listingId: { in: listingIds } }] : []),
            ],
          },
        }),
      ]);

    const countsByDay = new Map(
      dailyViews.map((row) => [row.day, Number(row.count)]),
    );
    const viewsOverTime = Array.from({ length: query.days }, (_, index) => {
      const day = new Date(since);
      day.setUTCDate(since.getUTCDate() + index);
      const date = day.toISOString().slice(0, 10);
      return { date, views: countsByDay.get(date) ?? 0 };
    });

    return {
      propertyId,
      totalViews,
      viewsOverTime,
      periodDays: query.days,
      favorites: favorites.length,
      rentalRequests,
      bookings,
    };
  }

  async update(id: string, requesterId: string, dto: UpdatePropertyDto) {
    await this.assertCanManage(id, requesterId);
    this.validateCoordinates(dto.latitude, dto.longitude);

    const current = await this.prisma.property.findUnique({
      where: { id },
      include: { listings: { select: { id: true }, take: 1 } },
    });
    if (!current) throw new NotFoundException('Property not found');

    const hasLocationPath =
      dto.country !== undefined ||
      dto.province !== undefined ||
      dto.city !== undefined ||
      dto.area !== undefined ||
      dto.blockSector !== undefined;
    let locationId: string | undefined;
    if (hasLocationPath) {
      if (!dto.country || !dto.province || !dto.city || !dto.area) {
        throw new BadRequestException(
          'When changing location, provide country, province, city, and area together',
        );
      }
      locationId = (
        await this.locationsService.resolveLocationPath({
          country: dto.country,
          province: dto.province,
          city: dto.city,
          area: dto.area,
          blockSector: dto.blockSector,
        })
      ).id;
    }

    const nextStatus =
      current.status === PropertyStatus.ACTIVE &&
      dto.availability === ListingAvailability.RENTED
        ? PropertyStatus.RENTED
        : current.status === PropertyStatus.RENTED &&
            dto.availability === ListingAvailability.AVAILABLE
          ? PropertyStatus.ACTIVE
          : current.status;

    const propertyData: Prisma.PropertyUpdateInput = {
      ...(dto.title !== undefined && { title: dto.title.trim() }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.type !== undefined && { propertyType: dto.type }),
      ...(dto.rentalMode !== undefined && { rentalMode: dto.rentalMode }),
      ...(dto.price !== undefined && { price: dto.price }),
      ...(dto.securityDeposit !== undefined && {
        securityDeposit: dto.securityDeposit,
      }),
      ...(dto.bedrooms !== undefined && { bedrooms: dto.bedrooms }),
      ...(dto.bathrooms !== undefined && { bathrooms: dto.bathrooms }),
      ...(dto.areaSizeSqft !== undefined && { areaSizeSqft: dto.areaSizeSqft }),
      ...(dto.furnishedStatus !== undefined && {
        furnishedStatus: dto.furnishedStatus,
      }),
      ...(dto.rules !== undefined && { rules: dto.rules }),
      ...(dto.address !== undefined && { address: dto.address.trim() }),
      ...(dto.country !== undefined && { country: dto.country.trim() }),
      ...(dto.city !== undefined && { city: dto.city.trim() }),
      ...(dto.area !== undefined && { area: dto.area.trim() }),
      ...(dto.latitude !== undefined && { latitude: dto.latitude }),
      ...(dto.longitude !== undefined && { longitude: dto.longitude }),
      ...(locationId && { location: { connect: { id: locationId } } }),
      ...(dto.availability !== undefined && { availability: dto.availability }),
      ...(nextStatus !== current.status && { status: nextStatus }),
    };

    await this.prisma.$transaction(async (transaction) => {
      await transaction.property.update({ where: { id }, data: propertyData });
      const listingId = current.listings[0]?.id;
      if (listingId) {
        await transaction.listing.update({
          where: { id: listingId },
          data: {
            ...(dto.title !== undefined && { title: dto.title.trim() }),
            ...(dto.description !== undefined && {
              description: dto.description,
            }),
            ...(dto.rules !== undefined && { rules: dto.rules }),
            ...(dto.address !== undefined && { address: dto.address.trim() }),
            ...(dto.city !== undefined && { city: dto.city.trim() }),
            ...(dto.area !== undefined && { area: dto.area.trim() }),
            ...(dto.type !== undefined && { type: dto.type }),
            ...(dto.rentalMode !== undefined && {
              rentalDuration: dto.rentalMode,
              listingMode: this.toListingMode(dto.rentalMode),
            }),
            ...(dto.price !== undefined && { rent: dto.price }),
            ...(dto.securityDeposit !== undefined && {
              deposit: dto.securityDeposit,
            }),
            ...(dto.bedrooms !== undefined && {
              bedrooms: dto.bedrooms,
              roomCount: dto.bedrooms,
            }),
            ...(dto.bathrooms !== undefined && { bathrooms: dto.bathrooms }),
            ...(dto.areaSizeSqft !== undefined && { sqft: dto.areaSizeSqft }),
            ...(dto.furnishedStatus !== undefined && {
              furnishedStatus: dto.furnishedStatus,
            }),
            ...(dto.latitude !== undefined && { latitude: dto.latitude }),
            ...(dto.longitude !== undefined && { longitude: dto.longitude }),
            ...(locationId && { locationId }),
            ...(dto.availability !== undefined && {
              availability: dto.availability,
            }),
            ...(nextStatus !== current.status && {
              status: this.toListingStatus(nextStatus),
              publicationStatus: this.toPublicationStatus(nextStatus),
            }),
          },
        });
      }
    });

    return this.findById(id, requesterId);
  }

  async remove(id: string, requesterId: string) {
    await this.assertCanManage(id, requesterId);
    const property = await this.prisma.property.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!property) throw new NotFoundException('Property not found');

    await this.prisma.$transaction([
      this.prisma.property.update({
        where: { id },
        data: { status: PropertyStatus.EXPIRED },
      }),
      this.prisma.listing.updateMany({
        where: { propertyId: id },
        data: {
          status: ListingStatus.REMOVED,
          publicationStatus: ListingPublicationStatus.UNPUBLISHED,
        },
      }),
    ]);

    return { id, status: PropertyStatus.EXPIRED };
  }

  async updateStatus(id: string, status: PropertyStatus) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!property) throw new NotFoundException('Property not found');

    await this.prisma.$transaction([
      this.prisma.property.update({ where: { id }, data: { status } }),
      this.prisma.listing.updateMany({
        where: { propertyId: id },
        data: {
          status: this.toListingStatus(status),
          publicationStatus: this.toPublicationStatus(status),
          availability:
            status === PropertyStatus.RENTED
              ? ListingAvailability.RENTED
              : status === PropertyStatus.ACTIVE
                ? ListingAvailability.AVAILABLE
                : undefined,
        },
      }),
    ]);

    return this.prisma.property.findUnique({
      where: { id },
      include: this.propertyInclude(),
    });
  }

  async assignManager(propertyId: string, ownerId: string, managerId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    });
    if (!property) throw new NotFoundException('Property not found');
    if (property.ownerId !== ownerId) {
      throw new ForbiddenException(
        'Only the property owner can assign managers',
      );
    }

    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      select: { id: true, roles: true, isSuspended: true },
    });
    if (!manager || manager.isSuspended) {
      throw new NotFoundException('Eligible manager account not found');
    }
    const eligibleRoles: Role[] = [
      Role.LANDLORD,
      Role.AGENT,
      Role.PROPERTY_MANAGER,
      Role.HOTEL_MANAGER,
      Role.HOSTEL_MANAGER,
    ];
    if (!manager.roles.some((role) => eligibleRoles.includes(role))) {
      throw new BadRequestException(
        'User does not have a property-management role',
      );
    }

    return this.prisma.propertyManager.upsert({
      where: { propertyId_userId: { propertyId, userId: managerId } },
      create: { propertyId, userId: managerId },
      update: {},
      select: {
        propertyId: true,
        user: { select: { id: true, fullName: true } },
        createdAt: true,
      },
    });
  }

  async revokeManager(propertyId: string, ownerId: string, managerId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    });
    if (!property) throw new NotFoundException('Property not found');
    if (property.ownerId !== ownerId) {
      throw new ForbiddenException(
        'Only the property owner can revoke managers',
      );
    }

    const result = await this.prisma.propertyManager.deleteMany({
      where: { propertyId, userId: managerId },
    });
    if (result.count === 0)
      throw new NotFoundException('Property manager not found');
    return { propertyId, userId: managerId, revoked: true };
  }

  async getAmenities() {
    return this.prisma.amenity.findMany({ orderBy: { name: 'asc' } });
  }

  async addImages(
    propertyId: string,
    requesterId: string,
    files: ImageUploadFile[],
    altText?: string,
  ) {
    await this.assertCanManage(propertyId, requesterId);
    if (!files.length)
      throw new BadRequestException('Upload at least one image');
    if (files.length > 12)
      throw new BadRequestException('Upload no more than 12 images at once');
    for (const file of files) {
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException('Only image files can be uploaded');
      }
    }

    const [currentImageCount, listing] = await Promise.all([
      this.prisma.propertyImage.count({ where: { propertyId } }),
      this.prisma.listing.findFirst({
        where: { propertyId },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const uploaded: Array<{ secureUrl: string; publicId: string }> = [];
    try {
      for (const file of files) {
        uploaded.push(await this.uploadService.uploadToCloudinary(file));
      }
      await this.prisma.propertyImage.createMany({
        data: uploaded.map((image, index) => ({
          propertyId,
          listingId: listing?.id,
          url: image.secureUrl,
          publicId: image.publicId,
          altText: altText ?? files[index].originalname,
          sortOrder: currentImageCount + index,
          isPrimary: currentImageCount === 0 && index === 0,
        })),
      });
    } catch (error) {
      await Promise.allSettled(
        uploaded.map((image) =>
          this.uploadService.deleteFromCloudinary(image.publicId),
        ),
      );
      throw error;
    }

    return this.prisma.propertyImage.findMany({
      where: { propertyId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async updateImage(
    propertyId: string,
    imageId: string,
    requesterId: string,
    dto: UpdatePropertyImageDto,
  ) {
    await this.assertCanManage(propertyId, requesterId);
    if (Object.values(dto).every((value) => value === undefined)) {
      throw new BadRequestException('Provide sortOrder, isPrimary, or altText');
    }

    const image = await this.prisma.propertyImage.findFirst({
      where: { id: imageId, propertyId },
      select: { id: true },
    });
    if (!image) throw new NotFoundException('Property image not found');

    const listing = await this.prisma.listing.findFirst({
      where: { propertyId },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    await this.prisma.$transaction(async (transaction) => {
      if (dto.isPrimary) {
        await transaction.propertyImage.updateMany({
          where: { propertyId },
          data: { isPrimary: false },
        });
      }
      await transaction.propertyImage.update({
        where: { id: imageId },
        data: {
          ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
          ...(dto.isPrimary !== undefined && { isPrimary: dto.isPrimary }),
          ...(dto.altText !== undefined && { altText: dto.altText }),
          ...(listing && { listingId: listing.id }),
        },
      });
    });

    return this.prisma.propertyImage.findUnique({ where: { id: imageId } });
  }

  async deleteImage(propertyId: string, imageId: string, requesterId: string) {
    await this.assertCanManage(propertyId, requesterId);
    const image = await this.prisma.propertyImage.findFirst({
      where: { id: imageId, propertyId },
    });
    if (!image) throw new NotFoundException('Property image not found');

    if (image.publicId) {
      await this.uploadService.deleteFromCloudinary(image.publicId);
    }
    await this.prisma.$transaction(async (transaction) => {
      await transaction.propertyImage.delete({ where: { id: imageId } });
      if (image.isPrimary) {
        const replacement = await transaction.propertyImage.findFirst({
          where: { propertyId },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          select: { id: true },
        });
        if (replacement) {
          await transaction.propertyImage.update({
            where: { id: replacement.id },
            data: { isPrimary: true },
          });
        }
      }
    });
    return { propertyId, imageId, deleted: true };
  }

  async addAmenities(
    propertyId: string,
    requesterId: string,
    amenityIds: string[],
  ) {
    await this.assertCanManage(propertyId, requesterId);
    const amenities = await this.prisma.amenity.findMany({
      where: { id: { in: amenityIds } },
      select: { id: true },
    });
    if (amenities.length !== new Set(amenityIds).size) {
      throw new BadRequestException('One or more amenity IDs are invalid');
    }

    const listing = await this.prisma.listing.findFirst({
      where: { propertyId },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    await this.prisma.propertyAmenity.createMany({
      data: amenityIds.map((amenityId) => ({
        propertyId,
        listingId: listing?.id,
        amenityId,
      })),
      skipDuplicates: true,
    });

    return this.prisma.propertyAmenity.findMany({
      where: { propertyId },
      include: { amenity: true },
      orderBy: { amenity: { name: 'asc' } },
    });
  }

  async deleteAmenity(
    propertyId: string,
    amenityId: string,
    requesterId: string,
  ) {
    await this.assertCanManage(propertyId, requesterId);
    const result = await this.prisma.propertyAmenity.deleteMany({
      where: { propertyId, amenityId },
    });
    if (!result.count)
      throw new NotFoundException('Property amenity not found');
    return { propertyId, amenityId, deleted: true };
  }

  private propertyInclude() {
    return {
      owner: {
        select: {
          id: true,
          fullName: true,
          isVerified: true,
          trustScore: true,
        },
      },
      location: {
        include: {
          parent: {
            include: {
              parent: {
                include: { parent: { include: { parent: true } } },
              },
            },
          },
        },
      },
      listings: {
        take: 1,
        select: { id: true, status: true, publicationStatus: true },
      },
      images: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
      amenities: {
        include: { amenity: true },
        orderBy: { amenity: { name: 'asc' } },
      },
      managers: {
        select: {
          user: { select: { id: true, fullName: true } },
        },
      },
    } satisfies Prisma.PropertyInclude;
  }

  private searchOrderBy(
    sort: PropertySearchSort = PropertySearchSort.RECOMMENDED,
  ): Prisma.PropertyOrderByWithRelationInput[] {
    switch (sort) {
      case PropertySearchSort.NEWEST:
        return [{ createdAt: 'desc' }, { id: 'desc' }];
      case PropertySearchSort.PRICE_ASC:
        return [{ price: 'asc' }, { id: 'desc' }];
      case PropertySearchSort.PRICE_DESC:
        return [{ price: 'desc' }, { id: 'desc' }];
      case PropertySearchSort.MOST_VIEWED:
        return [{ views: { _count: 'desc' } }, { createdAt: 'desc' }];
      case PropertySearchSort.MOST_FAVORITED:
        return [{ favorites: { _count: 'desc' } }, { createdAt: 'desc' }];
      case PropertySearchSort.RECOMMENDED:
      default:
        return [
          { owner: { trustScore: 'desc' } },
          { favorites: { _count: 'desc' } },
          { views: { _count: 'desc' } },
          { createdAt: 'desc' },
          { id: 'desc' },
        ];
    }
  }

  private async assertCanManage(propertyId: string, userId: string) {
    if (!(await this.canManage(propertyId, userId))) {
      const exists = await this.prisma.property.findUnique({
        where: { id: propertyId },
        select: { id: true },
      });
      if (!exists) throw new NotFoundException('Property not found');
      throw new ForbiddenException(
        'You can only manage properties you own or are assigned to',
      );
    }
  }

  private async canManage(propertyId: string, userId: string) {
    const property = await this.prisma.property.findFirst({
      where: {
        id: propertyId,
        OR: [{ ownerId: userId }, { managers: { some: { userId } } }],
      },
      select: { id: true },
    });
    return !!property;
  }

  private validateCoordinates(latitude?: number, longitude?: number) {
    if ((latitude === undefined) !== (longitude === undefined)) {
      throw new BadRequestException('Provide both latitude and longitude');
    }
  }

  private hashViewIdentity(identity: string) {
    const secret =
      process.env.SESSION_HASH_SECRET ??
      process.env.JWT_SECRET ??
      'rentra-view-session';
    return createHmac('sha256', secret).update(identity).digest('hex');
  }

  private toListingMode(mode: RentalDuration) {
    return mode === RentalDuration.DAILY ||
      mode === RentalDuration.NIGHTLY ||
      mode === RentalDuration.WEEKLY
      ? 'SHORT_TERM'
      : 'LONG_TERM';
  }

  private toListingStatus(status: PropertyStatus) {
    switch (status) {
      case PropertyStatus.DRAFT:
        return ListingStatus.DRAFT;
      case PropertyStatus.ACTIVE:
      case PropertyStatus.RENTED:
        return ListingStatus.PUBLISHED;
      case PropertyStatus.REJECTED:
      case PropertyStatus.SUSPENDED:
      case PropertyStatus.EXPIRED:
        return ListingStatus.REMOVED;
      case PropertyStatus.PENDING_VERIFICATION:
        return ListingStatus.PENDING;
    }
  }

  private toPublicationStatus(status: PropertyStatus) {
    return status === PropertyStatus.ACTIVE
      ? ListingPublicationStatus.PUBLISHED
      : ListingPublicationStatus.UNPUBLISHED;
  }
}
