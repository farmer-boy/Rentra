import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AvailabilityStatus, Prisma, PropertyStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  AvailabilityRangeDto,
  BlockAvailabilityDto,
} from './dto/availability-range.dto';

const UNAVAILABLE_STATUSES: AvailabilityStatus[] = [
  'BLOCKED',
  'MAINTENANCE',
  'BOOKED',
  'HOLD',
  'UNAVAILABLE',
] as const;

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getPropertyAvailability(
    propertyId: string,
    range: AvailabilityRangeDto,
  ) {
    const { start, end, dates } = this.parseRange(range);
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, status: true, listings: { select: { id: true } } },
    });
    if (!property) throw new NotFoundException('Property not found');
    if (property.status !== PropertyStatus.ACTIVE) {
      throw new NotFoundException('Property not found');
    }

    const listingIds = property.listings.map((listing) => listing.id);
    const [availabilityRows, bookings] = await Promise.all([
      this.prisma.availability.findMany({
        where: {
          OR: [
            { propertyId },
            ...(listingIds.length ? [{ listingId: { in: listingIds } }] : []),
          ],
          date: { gte: start, lt: end },
        },
        orderBy: { date: 'asc' },
      }),
      this.prisma.booking.findMany({
        where: {
          OR: [
            { propertyId },
            ...(listingIds.length ? [{ listingId: { in: listingIds } }] : []),
          ],
          status: { in: ['PENDING', 'PAYMENT_PENDING', 'HELD', 'CONFIRMED'] },
          startDate: { lt: end },
          endDate: { gt: start },
        },
        select: { startDate: true, endDate: true },
      }),
    ]);

    const rowByDate = new Map(
      availabilityRows.map((row) => [this.dateKey(row.date), row]),
    );
    return {
      propertyId,
      startDate: range.startDate,
      endDate: range.endDate,
      dates: dates.map((date) => {
        const row = rowByDate.get(this.dateKey(date));
        const booked = bookings.some(
          (booking) =>
            booking.startDate < this.addDays(date, 1) && booking.endDate > date,
        );
        return {
          date: this.dateKey(date),
          status: booked ? 'BOOKED' : (row?.status ?? 'AVAILABLE'),
          blockedReason: row?.blockedReason ?? null,
        };
      }),
    };
  }

  async block(propertyId: string, userId: string, dto: BlockAvailabilityDto) {
    await this.assertCanManage(propertyId, userId);
    const { start, end, dates } = this.parseRange(dto);
    return this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw(Prisma.sql`
        SELECT pg_advisory_xact_lock(hashtext(${propertyId}))
      `);
      const conflict = await transaction.booking.findFirst({
        where: {
          propertyId,
          status: { in: ['PENDING', 'PAYMENT_PENDING', 'HELD', 'CONFIRMED'] },
          startDate: { lt: end },
          endDate: { gt: start },
        },
        select: { id: true },
      });
      if (conflict)
        throw new BadRequestException(
          'Cannot block dates that contain an active booking',
        );

      const unavailableRow = await transaction.availability.findFirst({
        where: {
          propertyId,
          date: { gte: start, lt: end },
          status: { in: UNAVAILABLE_STATUSES },
        },
        select: { date: true, status: true },
      });
      if (unavailableRow) {
        throw new BadRequestException(
          `Cannot block ${this.dateKey(unavailableRow.date)} because it is already ${unavailableRow.status.toLowerCase()}`,
        );
      }

      for (const date of dates) {
        const existing = await transaction.availability.findFirst({
          where: { propertyId, date },
        });
        if (existing) {
          await transaction.availability.update({
            where: { id: existing.id },
            data: {
              status: dto.status as AvailabilityStatus,
              blockedReason: dto.reason?.trim(),
            },
          });
        } else {
          await transaction.availability.create({
            data: {
              propertyId,
              date,
              status: dto.status as AvailabilityStatus,
              blockedReason: dto.reason?.trim(),
            },
          });
        }
      }
      return {
        propertyId,
        startDate: dto.startDate,
        endDate: dto.endDate,
        status: dto.status,
        dates: dates.map((date) => this.dateKey(date)),
      };
    });
  }

  async unblock(
    propertyId: string,
    userId: string,
    range: AvailabilityRangeDto,
  ) {
    await this.assertCanManage(propertyId, userId);
    const { start, end } = this.parseRange(range);
    const result = await this.prisma.availability.deleteMany({
      where: {
        propertyId,
        date: { gte: start, lt: end },
        status: { in: ['BLOCKED', 'MAINTENANCE'] },
      },
    });
    return { propertyId, removed: result.count };
  }

  async assertRangeAvailable(
    transaction: Prisma.TransactionClient,
    propertyId: string,
    listingId: string,
    hotelRoomId: string | undefined,
    hostelBedId: string | undefined,
    start: Date,
    end: Date,
  ) {
    const { dates } = this.parseRange({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
    const rows = await transaction.availability.findMany({
      where: {
        OR: [
          { propertyId },
          { listingId },
          ...(hotelRoomId ? [{ hotelRoomId }] : []),
          ...(hostelBedId ? [{ hostelBedId }] : []),
        ],
        date: { in: dates },
        status: { in: UNAVAILABLE_STATUSES },
      },
      select: { date: true, status: true },
    });
    if (rows.length) {
      throw new BadRequestException(
        `Requested dates include ${rows[0].status.toLowerCase()} availability on ${this.dateKey(rows[0].date)}`,
      );
    }
  }

  private async assertCanManage(propertyId: string, userId: string) {
    const property = await this.prisma.property.findFirst({
      where: {
        id: propertyId,
        OR: [{ ownerId: userId }, { managers: { some: { userId } } }],
      },
      select: { id: true },
    });
    if (!property) {
      const exists = await this.prisma.property.findUnique({
        where: { id: propertyId },
        select: { id: true },
      });
      if (!exists) throw new NotFoundException('Property not found');
      throw new ForbiddenException(
        'Only the property owner or manager can manage availability',
      );
    }
  }

  private parseRange(range: AvailabilityRangeDto) {
    const start = new Date(range.startDate);
    const end = new Date(range.endDate);
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(0, 0, 0, 0);
    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      start >= end
    ) {
      throw new BadRequestException('endDate must be after startDate');
    }
    const dates: Date[] = [];
    for (let date = new Date(start); date < end; date = this.addDays(date, 1))
      dates.push(date);
    return { start, end, dates };
  }

  private addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + days);
    return next;
  }

  private dateKey(date: Date) {
    return date.toISOString().slice(0, 10);
  }
}
