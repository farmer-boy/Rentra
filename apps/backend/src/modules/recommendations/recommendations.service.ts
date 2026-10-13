import { BadRequestException, Injectable } from '@nestjs/common';
import {
  BookingStatus,
  Prisma,
  PropertyStatus,
  PropertyType,
  VerificationStatus,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RecommendationQueryDto } from './dto/recommendation-query.dto';

const WEIGHTS = {
  city: 25,
  area: 20,
  propertyType: 15,
  budget: 15,
  bedrooms: 10,
  favorite: 7,
  view: 5,
  booking: 3,
} as const;

type HistorySignals = {
  city: Map<string, number>;
  area: Map<string, number>;
  propertyType: Map<PropertyType, number>;
  bedrooms: Map<number, number>;
};

@Injectable()
export class RecommendationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: RecommendationQueryDto, userId?: string) {
    const sanitizedLimit = Math.min(Math.max(query.limit ?? 10, 1), 50);
    const sanitizedPage = Math.max(query.page ?? 1, 1);

    if (
      query.minPrice !== undefined &&
      query.maxPrice !== undefined &&
      query.minPrice > query.maxPrice
    ) {
      throw new BadRequestException('minPrice cannot be greater than maxPrice');
    }

    const where: Prisma.PropertyWhereInput = {
      status: PropertyStatus.ACTIVE,
      ...(query.city && {
        city: { contains: query.city.trim(), mode: 'insensitive' },
      }),
      ...(query.area && {
        area: { contains: query.area.trim(), mode: 'insensitive' },
      }),
      ...(query.propertyType && { propertyType: query.propertyType }),
      ...(query.bedrooms !== undefined && { bedrooms: query.bedrooms }),
      ...((query.minPrice !== undefined || query.maxPrice !== undefined) && {
        price: {
          gte: query.minPrice ?? 0,
          lte: query.maxPrice ?? Number.MAX_SAFE_INTEGER,
        },
      }),
      ...(userId && { ownerId: { not: userId } }),
    };

    const [total, candidates] = await Promise.all([
      this.prisma.property.count({ where }),
      this.prisma.property.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { price: 'asc' }],
        take: Math.min(Math.max(sanitizedLimit * 5, 30), 200),
        select: {
          id: true,
          title: true,
          city: true,
          area: true,
          propertyType: true,
          price: true,
          bedrooms: true,
          verificationStatus: true,
          createdAt: true,
          status: true,
        },
      }),
    ]);

    const userSignals = userId ? await this.getUserHistorySignals(userId) : this.emptySignals();

    const scoredProperties = candidates
      .map((property) => {
        const normalizedCity = this.normalize(property.city);
        const normalizedArea = this.normalize(property.area);
        const reasons: string[] = [];
        const seenReasons = new Set<string>();
        let score = 0;

        const addReason = (reason: string) => {
          if (!reason || seenReasons.has(reason)) {
            return;
          }
          seenReasons.add(reason);
          reasons.push(reason);
        };

        const addSignal = (signalWeight: number, reason: string) => {
          score += signalWeight;
          addReason(reason);
        };

        if (query.city && this.normalize(query.city) === normalizedCity) {
          addSignal(WEIGHTS.city, 'Matches your preferred city');
        }

        if (query.area && this.normalize(query.area) === normalizedArea) {
          addSignal(WEIGHTS.area, 'Matches your preferred area');
        }

        if (query.propertyType && property.propertyType === query.propertyType) {
          addSignal(WEIGHTS.propertyType, 'Matches your selected property type');
        }

        if (
          query.minPrice !== undefined ||
          query.maxPrice !== undefined
        ) {
          const withinBudget =
            property.price >= (query.minPrice ?? property.price) &&
            property.price <= (query.maxPrice ?? property.price);
          if (withinBudget) {
            addSignal(WEIGHTS.budget, 'Matches your selected budget');
          }
        }

        if (query.bedrooms !== undefined && property.bedrooms === query.bedrooms) {
          addSignal(WEIGHTS.bedrooms, 'Matches your bedroom preference');
        }

        const cityWeight = userSignals.city.get(normalizedCity);
        if (cityWeight) {
          addSignal(Math.round(WEIGHTS.city * cityWeight), 'Matches a city you recently searched');
        }

        const areaWeight = userSignals.area.get(normalizedArea);
        if (areaWeight) {
          addSignal(Math.round(WEIGHTS.area * areaWeight), 'Matches an area you recently explored');
        }

        const propertyTypeWeight = userSignals.propertyType.get(property.propertyType);
        if (propertyTypeWeight) {
          addSignal(
            Math.round(WEIGHTS.propertyType * propertyTypeWeight),
            'Matches a property type you favorited or booked before',
          );
        }

        if (typeof query.bedrooms === 'number' && property.bedrooms === query.bedrooms) {
          addSignal(WEIGHTS.bedrooms, 'Matches a bedroom count you selected before');
        }

        const bedroomWeight = userSignals.bedrooms.get(property.bedrooms);
        if (bedroomWeight) {
          addSignal(Math.round(WEIGHTS.bedrooms * bedroomWeight), 'Matches a bedroom preference from your activity');
        }

        const favoriteScore = this.getSimilarityScore(property, userSignals, 'favorite');
        if (favoriteScore > 0) {
          addSignal(Math.round(WEIGHTS.favorite * favoriteScore), 'Similar to a property you already favorited');
        }

        const viewScore = this.getSimilarityScore(property, userSignals, 'view');
        if (viewScore > 0) {
          addSignal(Math.round(WEIGHTS.view * viewScore), 'Similar to a property you viewed recently');
        }

        const bookingScore = this.getSimilarityScore(property, userSignals, 'booking');
        if (bookingScore > 0) {
          addSignal(Math.round(WEIGHTS.booking * bookingScore), 'Similar to a property from your booking history');
        }

        if (reasons.length === 0) {
          score = 50;
          addReason('Recently published eligible property');
        }

        const normalizedScore = Math.min(100, Math.round(score));

        return {
          property: {
            id: property.id,
            title: property.title,
            city: property.city ?? '',
            area: property.area ?? '',
            propertyType: property.propertyType,
            price: property.price,
            bedrooms: property.bedrooms,
            verificationStatus: property.verificationStatus,
            isRentraVerified: property.verificationStatus === VerificationStatus.APPROVED,
          },
          score: normalizedScore,
          reasons: reasons.slice(0, 3),
          createdAt: property.createdAt,
        };
      })
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }
        return (
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime()
        );
      });

    const startIndex = (sanitizedPage - 1) * sanitizedLimit;
    const paginatedItems = scoredProperties.slice(startIndex, startIndex + sanitizedLimit);

    return {
      items: paginatedItems.map(({ property, score, reasons }) => ({
        property,
        score,
        reasons,
      })),
      pagination: {
        page: sanitizedPage,
        limit: sanitizedLimit,
        total,
      },
      strategy: 'RULE_BASED',
    };
  }

  private async getUserHistorySignals(userId: string): Promise<HistorySignals> {
    const [favorites, views, bookings, savedSearches] = await Promise.all([
      this.prisma.favorite.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: {
          createdAt: true,
          property: {
            select: {
              city: true,
              area: true,
              propertyType: true,
              bedrooms: true,
            },
          },
        },
      }),
      this.prisma.propertyView.findMany({
        where: { userId },
        orderBy: { viewedAt: 'desc' },
        take: 30,
        select: {
          viewedAt: true,
          property: {
            select: {
              city: true,
              area: true,
              propertyType: true,
              bedrooms: true,
            },
          },
          listing: {
            select: {
              city: true,
              area: true,
              type: true,
              bedrooms: true,
            },
          },
        },
      }),
      this.prisma.booking.findMany({
        where: {
          tenantId: userId,
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: {
          createdAt: true,
          property: {
            select: {
              city: true,
              area: true,
              propertyType: true,
              bedrooms: true,
            },
          },
          listing: {
            select: {
              city: true,
              area: true,
              type: true,
              bedrooms: true,
            },
          },
        },
      }),
      this.prisma.savedSearch.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { createdAt: true, filtersJson: true },
      }),
    ]);

    const city = new Map<string, number>();
    const area = new Map<string, number>();
    const propertyType = new Map<PropertyType, number>();
    const bedrooms = new Map<number, number>();

    for (const favorite of favorites) {
      this.applyPropertyActivity(city, area, propertyType, bedrooms, favorite.property, favorite.createdAt);
    }

    for (const view of views) {
      const viewedProperty =
        view.property || view.listing
          ? {
              city: view.property?.city ?? view.listing?.city,
              area: view.property?.area ?? view.listing?.area,
              propertyType:
                view.property?.propertyType ?? view.listing?.type,
              bedrooms:
                view.property?.bedrooms ?? view.listing?.bedrooms,
            }
          : null;
      if (viewedProperty) {
        this.applyPropertyActivity(
          city,
          area,
          propertyType,
          bedrooms,
          viewedProperty,
          view.viewedAt,
        );
      }
    }

    for (const booking of bookings) {
      const bookedProperty =
        booking.property || booking.listing
          ? {
              city: booking.property?.city ?? booking.listing?.city,
              area: booking.property?.area ?? booking.listing?.area,
              propertyType:
                booking.property?.propertyType ?? booking.listing?.type,
              bedrooms:
                booking.property?.bedrooms ?? booking.listing?.bedrooms,
            }
          : null;
      if (bookedProperty) {
        this.applyPropertyActivity(
          city,
          area,
          propertyType,
          bedrooms,
          bookedProperty,
          booking.createdAt,
        );
      }
    }

    for (const savedSearch of savedSearches) {
      const filters = (savedSearch.filtersJson ?? {}) as Record<string, unknown>;
      const cityPreference = this.normalize(filters.city as string | undefined);
      const areaPreference = this.normalize(filters.area as string | undefined);
      const typePreference = filters.propertyType as PropertyType | undefined;
      const bedroomPreference = typeof filters.bedrooms === 'number' ? Number(filters.bedrooms) : undefined;

      if (cityPreference) {
        this.addWeightedSignal(city, cityPreference, this.recencyWeight(savedSearch.createdAt));
      }

      if (areaPreference) {
        this.addWeightedSignal(area, areaPreference, this.recencyWeight(savedSearch.createdAt));
      }

      if (typePreference && Object.values(PropertyType).includes(typePreference)) {
        this.addWeightedSignal(propertyType, typePreference, this.recencyWeight(savedSearch.createdAt));
      }

      if (typeof bedroomPreference === 'number' && bedroomPreference >= 0) {
        this.addWeightedSignal(
          bedrooms,
          bedroomPreference,
          this.recencyWeight(savedSearch.createdAt),
        );
      }
    }

    return { city, area, propertyType, bedrooms };
  }

  private emptySignals(): HistorySignals {
    return {
      city: new Map<string, number>(),
      area: new Map<string, number>(),
      propertyType: new Map<PropertyType, number>(),
      bedrooms: new Map<number, number>(),
    };
  }

  private applyPropertyActivity(
    cityMap: Map<string, number>,
    areaMap: Map<string, number>,
    propertyTypeMap: Map<PropertyType, number>,
    bedroomMap: Map<number, number>,
    property: {
      city?: string | null;
      area?: string | null;
      propertyType?: PropertyType | null;
      bedrooms?: number | null;
    } | null,
    activityAt: Date,
  ) {
    if (!property) {
      return;
    }

    const city = this.normalize(property.city);
    const area = this.normalize(property.area);
    const type = property.propertyType;
    const bedrooms = property.bedrooms;
    const recency = this.recencyWeight(activityAt);

    if (city) {
      this.addWeightedSignal(cityMap, city, recency);
    }
    if (area) {
      this.addWeightedSignal(areaMap, area, recency);
    }
    if (type && Object.values(PropertyType).includes(type)) {
      this.addWeightedSignal(propertyTypeMap, type, recency);
    }
    if (typeof bedrooms === 'number' && bedrooms >= 0) {
      this.addWeightedSignal(bedroomMap, bedrooms, recency);
    }
  }

  private addWeightedSignal<T extends string | number>(
    map: Map<T, number>,
    key: T,
    weight: number,
  ) {
    const current = map.get(key) ?? 0;
    map.set(key, Math.max(current, weight));
  }

  private recencyWeight(date: Date) {
    const ageDays = Math.max(0, (Date.now() - date.getTime()) / 86_400_000);
    if (ageDays <= 7) return 1;
    if (ageDays <= 30) return 0.75;
    if (ageDays <= 90) return 0.55;
    if (ageDays <= 180) return 0.35;
    return 0.2;
  }

  private getSimilarityScore(
    property: {
      city: string | null;
      area: string | null;
      propertyType: PropertyType;
      bedrooms: number | null;
    },
    signals: HistorySignals,
    type: 'favorite' | 'view' | 'booking',
  ) {
    let total = 0;
    const normalizedCity = this.normalize(property.city);
    const normalizedArea = this.normalize(property.area);

    if (normalizedCity && signals.city.get(normalizedCity)) {
      total += signals.city.get(normalizedCity)!;
    }

    if (normalizedArea && signals.area.get(normalizedArea)) {
      total += signals.area.get(normalizedArea)!;
    }

    if (signals.propertyType.get(property.propertyType)) {
      total += signals.propertyType.get(property.propertyType)!;
    }

    if (typeof property.bedrooms === 'number' && signals.bedrooms.get(property.bedrooms)) {
      total += signals.bedrooms.get(property.bedrooms)!;
    }

    if (type === 'favorite') {
      return Math.min(1, total / 2.5);
    }

    if (type === 'view') {
      return Math.min(1, total / 2);
    }

    return Math.min(1, total / 3);
  }

  private normalize(value?: string | null) {
    return (value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
  }
}
