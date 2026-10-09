import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AvailabilityStatus,
  BookingStatus,
  Prisma,
  PropertyStatus,
} from '@prisma/client';
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

const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  'PENDING',
  'PAYMENT_PENDING',
  'HELD',
  'CONFIRMED',
] as const;

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getPropertyAvailability(
    propertyId: string,
    range: AvailabilityRangeDto,
  ) {
    const { start, end, dates } = this.parseRange(range);
    const selectedUnitCount = [
      range.hotelRoomId,
      range.hostelRoomId,
      range.hostelBedId,
    ].filter(Boolean).length;
    if (selectedUnitCount > 1) {
      throw new BadRequestException(
        'Select only one hotel room, hostel room, or hostel bed',
      );
    }

    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        status: true,
        listings: { select: { id: true } },
        hotel: { select: { rooms: { select: { id: true } } } },
      },
    });
    if (!property) throw new NotFoundException('Property not found');
    if (property.status !== PropertyStatus.ACTIVE) {
      throw new NotFoundException('Property not found');
    }

    const listingIds = property.listings.map((listing) => listing.id);
    const hotelRoomIds = property.hotel?.rooms.map((room) => room.id) ?? [];
    const hostelRooms = listingIds.length
      ? await this.prisma.hostelRoom.findMany({
          where: { listingId: { in: listingIds } },
          select: {
            id: true,
            beds: { select: { id: true } },
          },
        })
      : [];
    const hostelRoomIds = hostelRooms.map((room) => room.id);
    const hostelBedIds = hostelRooms.flatMap((room) =>
      room.beds.map((bed) => bed.id),
    );

    if (
      range.hotelRoomId &&
      !hotelRoomIds.includes(range.hotelRoomId)
    ) {
      throw new NotFoundException('Hotel room not found for this property');
    }
    if (
      range.hostelRoomId &&
      !hostelRoomIds.includes(range.hostelRoomId)
    ) {
      throw new NotFoundException('Hostel room not found for this property');
    }
    if (
      range.hostelBedId &&
      !hostelBedIds.includes(range.hostelBedId)
    ) {
      throw new NotFoundException('Hostel bed not found for this property');
    }

    const allUnitIds = [...hotelRoomIds, ...hostelRoomIds, ...hostelBedIds];
    const selectedHotelRoomIds = range.hotelRoomId
      ? [range.hotelRoomId]
      : range.hostelRoomId
        ? []
        : hotelRoomIds;
    const selectedHostelRoomIds = range.hostelRoomId
      ? [range.hostelRoomId]
      : range.hostelBedId
        ? []
        : hostelRoomIds;
    const selectedHostelBedIds = range.hostelBedId
      ? [range.hostelBedId]
      : range.hostelRoomId
        ? (hostelRooms
            .find((room) => room.id === range.hostelRoomId)
            ?.beds.map((bed) => bed.id) ?? [])
        : hostelBedIds;

    const [availabilityRows, bookings] = await Promise.all([
      this.prisma.availability.findMany({
        where: {
          OR: [
            { propertyId },
            ...(listingIds.length ? [{ listingId: { in: listingIds } }] : []),
            ...(allUnitIds.length
              ? [
                  { hotelRoomId: { in: hotelRoomIds } },
                  { hostelRoomId: { in: hostelRoomIds } },
                  { hostelBedId: { in: hostelBedIds } },
                ]
              : []),
          ],
          date: { gte: start, lt: end },
        },
        orderBy: { date: 'asc' },
      }),
      this.prisma.booking.findMany({
        where: {
          AND: [
            {
              OR: [
                { propertyId },
                ...(listingIds.length
                  ? [{ listingId: { in: listingIds } }]
                  : []),
              ],
            },
            {
              OR: [
                { hotelRoomId: null, hostelBedId: null },
                ...(selectedHotelRoomIds.length
                  ? [{ hotelRoomId: { in: selectedHotelRoomIds } }]
                  : []),
                ...(selectedHostelBedIds.length
                  ? [{ hostelBedId: { in: selectedHostelBedIds } }]
                  : []),
              ],
            },
          ],
          status: { in: ACTIVE_BOOKING_STATUSES },
          startDate: { lt: end },
          endDate: { gt: start },
        } satisfies Prisma.BookingWhereInput,
        select: {
          startDate: true,
          endDate: true,
          hotelRoomId: true,
          hostelBedId: true,
        },
      }),
    ]);

    return {
      propertyId,
      startDate: range.startDate,
      endDate: range.endDate,
      dates: dates.map((date) => {
        const dateKey = this.dateKey(date);
        const rows = availabilityRows.filter(
          (row) => this.dateKey(row.date) === dateKey,
        );
        const globalRows = rows.filter(
          (row) =>
            (row.propertyId === propertyId ||
              (row.listingId && listingIds.includes(row.listingId))) &&
            !row.hotelRoomId &&
            !row.hostelRoomId &&
            !row.hostelBedId,
        );
        const globalRow =
          globalRows.find((row) =>
            UNAVAILABLE_STATUSES.includes(row.status),
          ) ?? globalRows[0];
        const inRangeBookings = bookings.filter(
          (booking) =>
            booking.startDate < this.addDays(date, 1) &&
            booking.endDate > date,
        );
        const globalBooking = inRangeBookings.some(
          (booking) => !booking.hotelRoomId && !booking.hostelBedId,
        );

        let status = globalRow?.status ?? 'AVAILABLE';
        let blockedReason = globalRow?.blockedReason ?? null;
        if (
          status === 'AVAILABLE' &&
          (range.hotelRoomId || range.hostelRoomId || range.hostelBedId)
        ) {
          const unitRows = rows.filter((row) => {
            if (range.hotelRoomId)
              return row.hotelRoomId === range.hotelRoomId;
            if (range.hostelBedId)
              return (
                row.hostelBedId === range.hostelBedId ||
                selectedHostelRoomIds.includes(row.hostelRoomId ?? '')
              );
            return (
              row.hostelRoomId === range.hostelRoomId ||
              (row.hostelBedId &&
                selectedHostelBedIds.includes(row.hostelBedId))
            );
          });
          const unitRow = unitRows.find((row) =>
            UNAVAILABLE_STATUSES.includes(row.status),
          );
          if (unitRow) {
            status = unitRow.status;
            blockedReason = unitRow.blockedReason;
          }
          const unitBooking = inRangeBookings.some((booking) =>
            range.hotelRoomId
              ? booking.hotelRoomId === range.hotelRoomId
              : booking.hostelBedId
                ? selectedHostelBedIds.includes(booking.hostelBedId)
                : selectedHostelBedIds.includes(booking.hostelBedId ?? ''),
          );
          if (unitBooking || globalBooking) status = 'BOOKED';
        } else if (globalBooking) {
          status = 'BOOKED';
        } else if (
          status === 'AVAILABLE' &&
          !range.hotelRoomId &&
          !range.hostelRoomId &&
          !range.hostelBedId
        ) {
          const hotelAvailability = hotelRoomIds.map((unitId) => {
            const unitBooked = inRangeBookings.some(
              (booking) => booking.hotelRoomId === unitId,
            );
            const unitBlocked = rows.find(
              (row) =>
                row.hotelRoomId === unitId &&
                UNAVAILABLE_STATUSES.includes(row.status),
            );
            return unitBooked ? 'BOOKED' : (unitBlocked?.status ?? 'AVAILABLE');
          });
          const hostelAvailability = hostelBedIds.map((unitId) => {
            const unitBooked = inRangeBookings.some(
              (booking) => booking.hostelBedId === unitId,
            );
            const bedBlocked = rows.find(
              (row) =>
                (row.hostelBedId === unitId ||
                  selectedHostelRoomIds.includes(row.hostelRoomId ?? '')) &&
                UNAVAILABLE_STATUSES.includes(row.status),
            );
            return unitBooked ? 'BOOKED' : (bedBlocked?.status ?? 'AVAILABLE');
          });
          const unitStatuses = [...hotelAvailability, ...hostelAvailability];
          if (
            unitStatuses.length > 0 &&
            unitStatuses.every((unitStatus) => unitStatus !== 'AVAILABLE')
          ) {
            status = unitStatuses.every((unitStatus) => unitStatus === 'BOOKED')
              ? 'BOOKED'
              : (unitStatuses.find((unitStatus) => unitStatus === 'MAINTENANCE') ??
                unitStatuses.find((unitStatus) => unitStatus === 'BLOCKED') ??
                'BOOKED');
          }
        }
        return {
          date: dateKey,
          status,
          blockedReason,
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
      const property = await transaction.property.findUnique({
        where: { id: propertyId },
        select: { listings: { select: { id: true } } },
      });
      if (!property) throw new NotFoundException('Property not found');
      const conflict = await transaction.booking.findFirst({
        where: {
          OR: [
            { propertyId },
            ...property.listings.map((listing) => ({
              listingId: listing.id,
            })),
          ],
          status: { in: ACTIVE_BOOKING_STATUSES },
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
    return this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw(Prisma.sql`
        SELECT pg_advisory_xact_lock(hashtext(${propertyId}))
      `);
      const result = await transaction.availability.deleteMany({
        where: {
          propertyId,
          date: { gte: start, lt: end },
          status: { in: ['BLOCKED', 'MAINTENANCE'] },
        },
      });
      return { propertyId, removed: result.count };
    });
  }

  async assertRangeAvailable(
    transaction: Prisma.TransactionClient,
    propertyId: string,
    listingId: string,
    hotelRoomId: string | undefined,
    hostelRoomId: string | undefined,
    hostelBedId: string | undefined,
    start: Date,
    end: Date,
  ) {
    const { dates } = this.parseRange({
      startDate: this.dateKey(start),
      endDate: this.dateKey(end),
    });
    const rows = await transaction.availability.findMany({
      where: {
        OR: [
          { propertyId },
          { listingId },
          ...(hotelRoomId ? [{ hotelRoomId }] : []),
          ...(hostelRoomId ? [{ hostelRoomId }] : []),
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
    const start = this.parseDateOnly(range.startDate, 'startDate');
    const end = this.parseDateOnly(range.endDate, 'endDate');
    if (start >= end) {
      throw new BadRequestException('endDate must be after startDate');
    }
    if (end.getTime() - start.getTime() > 366 * 86_400_000) {
      throw new BadRequestException(
        'Availability ranges cannot exceed 366 days',
      );
    }
    const dates: Date[] = [];
    for (let date = new Date(start); date < end; date = this.addDays(date, 1))
      dates.push(date);
    return { start, end, dates };
  }

  private parseDateOnly(value: string, field: string) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match)
      throw new BadRequestException(`${field} must use YYYY-MM-DD format`);

    const [, year, month, day] = match;
    const date = new Date(
      Date.UTC(Number(year), Number(month) - 1, Number(day)),
    );
    if (
      date.getUTCFullYear() !== Number(year) ||
      date.getUTCMonth() !== Number(month) - 1 ||
      date.getUTCDate() !== Number(day)
    ) {
      throw new BadRequestException(`${field} must be a valid calendar date`);
    }
    return date;
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
