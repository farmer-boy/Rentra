import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Location, LocationLevel, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LocationSearchDto } from './dto/location-search.dto';

export interface LocationPathInput {
  country: string;
  province: string;
  city: string;
  area: string;
  blockSector?: string;
}

const EARTH_RADIUS_KM = 6371.0088;

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  getCountries() {
    return this.findByLevel(LocationLevel.COUNTRY);
  }

  getProvinces(countryId?: string) {
    return this.findByLevel(LocationLevel.PROVINCE, countryId);
  }

  getCities(provinceId?: string) {
    return this.findByLevel(LocationLevel.CITY, provinceId);
  }

  getAreas(cityId?: string) {
    return this.findByLevel(LocationLevel.AREA, cityId);
  }

  async findById(id: string) {
    const location = await this.prisma.location.findUnique({
      where: { id },
      include: {
        parent: {
          include: {
            parent: { include: { parent: { include: { parent: true } } } },
          },
        },
        children: { orderBy: { name: 'asc' } },
      },
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    return location;
  }

  async search(query: LocationSearchDto) {
    const hasLatitude = query.latitude !== undefined;
    const hasLongitude = query.longitude !== undefined;
    if (hasLatitude !== hasLongitude) {
      throw new BadRequestException(
        'Provide both latitude and longitude for nearby search',
      );
    }

    if (hasLatitude && hasLongitude) {
      return this.searchNearby(query);
    }

    if (!query.q?.trim()) {
      throw new BadRequestException(
        'Provide a search term or a latitude/longitude pair',
      );
    }

    return this.prisma.location.findMany({
      where: {
        ...(query.level && { level: query.level }),
        ...(query.parentId && { parentId: query.parentId }),
        OR: [
          { name: { contains: query.q.trim(), mode: 'insensitive' } },
          { slug: { contains: this.slugify(query.q), mode: 'insensitive' } },
        ],
      },
      include: { parent: true },
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
      take: query.limit,
    });
  }

  async resolveLocationPath(input: LocationPathInput): Promise<Location> {
    const country = this.requiredName(input.country, 'country');
    const province = this.requiredName(input.province, 'province');
    const city = this.requiredName(input.city, 'city');
    const area = this.requiredName(input.area, 'area');

    const countryLocation = await this.findOrCreate(
      country,
      LocationLevel.COUNTRY,
    );
    const provinceLocation = await this.findOrCreate(
      province,
      LocationLevel.PROVINCE,
      countryLocation.id,
    );
    const cityLocation = await this.findOrCreate(
      city,
      LocationLevel.CITY,
      provinceLocation.id,
    );
    const areaLocation = await this.findOrCreate(
      area,
      LocationLevel.AREA,
      cityLocation.id,
    );
    const leafLocation = input.blockSector?.trim()
      ? await this.findOrCreate(
          input.blockSector,
          LocationLevel.BLOCK_SECTOR,
          areaLocation.id,
        )
      : areaLocation;

    return leafLocation;
  }

  async findDescendantIds(filters: Partial<Record<LocationLevel, string>>) {
    const requested = Object.entries(filters).filter(
      ([, name]) => !!name?.trim(),
    ) as [LocationLevel, string][];
    if (requested.length === 0) return [];

    const locations = await this.prisma.location.findMany({
      select: { id: true, parentId: true, level: true, name: true },
    });
    const descendantsOf = (rootIds: Set<string>) => {
      const result = new Set(rootIds);
      let frontier = [...rootIds];
      while (frontier.length > 0) {
        const next = locations
          .filter(
            (location) =>
              location.parentId && frontier.includes(location.parentId),
          )
          .map((location) => location.id)
          .filter((id) => !result.has(id));
        next.forEach((id) => result.add(id));
        frontier = next;
      }
      return result;
    };

    const matchingSets = requested.map(([level, name]) => {
      const roots = new Set(
        locations
          .filter(
            (location) =>
              location.level === level &&
              location.name
                .toLocaleLowerCase()
                .includes(name.trim().toLocaleLowerCase()),
          )
          .map((location) => location.id),
      );
      return descendantsOf(roots);
    });

    return [
      ...matchingSets
        .slice(1)
        .reduce(
          (intersection, ids) =>
            new Set([...intersection].filter((id) => ids.has(id))),
          matchingSets[0],
        ),
    ];
  }

  private findByLevel(level: LocationLevel, parentId?: string) {
    return this.prisma.location.findMany({
      where: { level, ...(parentId && { parentId }) },
      orderBy: { name: 'asc' },
    });
  }

  private async searchNearby(query: LocationSearchDto) {
    const latitude = query.latitude!;
    const longitude = query.longitude!;
    const radiusKm = query.radiusKm ?? 10;
    const latitudeDelta = radiusKm / 110.574;
    const longitudeDelta =
      radiusKm /
      (111.32 * Math.max(Math.cos((latitude * Math.PI) / 180), 0.01));

    const locations = await this.prisma.location.findMany({
      where: {
        latitude: {
          gte: latitude - latitudeDelta,
          lte: latitude + latitudeDelta,
        },
        longitude: {
          gte: longitude - longitudeDelta,
          lte: longitude + longitudeDelta,
        },
        ...(query.level && { level: query.level }),
        ...(query.parentId && { parentId: query.parentId }),
        ...(query.q && {
          name: { contains: query.q.trim(), mode: 'insensitive' },
        }),
      },
      include: { parent: true },
    });

    return locations
      .map((location) => ({
        ...location,
        distanceKm: this.distanceKm(
          latitude,
          longitude,
          location.latitude!,
          location.longitude!,
        ),
      }))
      .filter((location) => location.distanceKm <= radiusKm)
      .sort((left, right) => left.distanceKm - right.distanceKm)
      .slice(0, query.limit);
  }

  private async findOrCreate(
    name: string,
    level: LocationLevel,
    parentId?: string,
  ) {
    const trimmedName = name.trim();
    const slug = this.slugify(trimmedName);
    const where: Prisma.LocationWhereInput = {
      level,
      slug,
      parentId: parentId ?? null,
    };
    const existing = await this.prisma.location.findFirst({ where });
    if (existing) return existing;

    try {
      return await this.prisma.location.create({
        data: { name: trimmedName, slug, level, parentId },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const racedLocation = await this.prisma.location.findFirst({ where });
        if (racedLocation) return racedLocation;
      }
      throw error;
    }
  }

  private requiredName(value: string | undefined, label: string) {
    if (!value?.trim()) {
      throw new BadRequestException(
        `${label} is required to resolve a property location`,
      );
    }
    return value.trim();
  }

  private slugify(value: string) {
    return value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-|-$/g, '');
  }

  private distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
    const deltaLatitude = toRadians(lat2 - lat1);
    const deltaLongitude = toRadians(lon2 - lon1);
    const haversine =
      Math.sin(deltaLatitude / 2) ** 2 +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(deltaLongitude / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(haversine));
  }
}
