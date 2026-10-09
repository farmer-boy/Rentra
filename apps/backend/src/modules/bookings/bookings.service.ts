import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingStatus,
  NotificationType,
  Prisma,
  PropertyStatus,
  RentalDuration,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AvailabilityService } from '../properties/availability.service';
import { CreateBookingDto } from './dto/create-booking.dto';

const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  'PENDING',
  'PAYMENT_PENDING',
  'HELD',
  'CONFIRMED',
] as const;

interface BookingAccessProjection {
  id: string;
  tenantId: string;
  propertyId?: string | null;
  property?: { ownerId: string; managers?: Array<{ userId: string }> } | null;
  listing?: { landlordId: string } | null;
}

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly availabilityService: AvailabilityService,
  ) {}

  async create(tenantId: string, propertyId: string, dto: CreateBookingDto) {
    const checkIn = this.parseDateOnly(dto.checkIn, 'checkIn');
    const checkOut = this.parseDateOnly(dto.checkOut, 'checkOut');
    if (checkIn >= checkOut)
      throw new BadRequestException('checkOut must be after checkIn');
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (checkIn < today)
      throw new BadRequestException('checkIn cannot be in the past');

    const booking = await this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${propertyId}))`,
      );

      const property = await transaction.property.findFirst({
        where: { id: propertyId, status: PropertyStatus.ACTIVE },
        include: {
          listings: { take: 1, orderBy: { createdAt: 'asc' } },
          hotel: { include: { rooms: { include: { roomType: true } } } },
        },
      });
      if (!property) throw new NotFoundException('Active property not found');
      if (
        ![
          RentalDuration.DAILY,
          RentalDuration.NIGHTLY,
          RentalDuration.WEEKLY,
        ].some((duration) => duration === property.rentalMode)
      ) {
        throw new BadRequestException(
          'This property is not configured for short-term bookings',
        );
      }
      const listing = property.listings[0];
      if (!listing)
        throw new BadRequestException('Property has no linked listing');

      const hostelBedId = dto.hostelBedId;
      let hostelRoomId: string | undefined;
      if (hostelBedId) {
        const bed = await transaction.hostelBed.findFirst({
          where: { id: hostelBedId, room: { listingId: listing.id } },
          select: { id: true, isAvailable: true, hostelRoomId: true },
        });
        if (!bed)
          throw new BadRequestException(
            'Hostel bed does not belong to this property',
          );
        if (!bed.isAvailable)
          throw new BadRequestException('Hostel bed is not available');
        hostelRoomId = bed.hostelRoomId;
        if (dto.guests !== 1)
          throw new BadRequestException(
            'A hostel bed booking must be for exactly one guest',
          );
      }
      if (
        (dto.hotelRoomId && dto.hostelBedId) ||
        (dto.roomTypeId && dto.hostelBedId)
      ) {
        throw new BadRequestException(
          'Choose either a hotel room or hostel bed, not both',
        );
      }
      if (dto.roomTypeId && !property.hotel) {
        throw new BadRequestException(
          'roomTypeId is only valid for hotel or guest-house properties',
        );
      }

      let selectedHotelRoomId = dto.hotelRoomId;
      let room = selectedHotelRoomId
        ? property.hotel?.rooms.find(
            (candidate) => candidate.id === selectedHotelRoomId,
          )
        : undefined;
      if (selectedHotelRoomId && !room) {
        throw new BadRequestException(
          'Hotel room does not belong to this property',
        );
      }
      if (room && dto.roomTypeId && room.roomTypeId !== dto.roomTypeId) {
        throw new BadRequestException(
          'The selected hotel room does not match the requested room type',
        );
      }
      if (!hostelBedId && property.hotel && !room) {
        const roomCandidates = property.hotel.rooms.filter(
          (candidate) =>
            candidate.isAvailable &&
            candidate.capacity >= dto.guests &&
            (candidate.roomType?.capacity ?? candidate.capacity) >=
              dto.guests &&
            (!dto.roomTypeId || candidate.roomTypeId === dto.roomTypeId),
        );
        if (!roomCandidates.length) {
          throw new BadRequestException(
            'No rooms match the requested room type',
          );
        }
        for (const candidate of roomCandidates) {
          const occupied = await transaction.booking.findFirst({
            where: {
              hotelRoomId: candidate.id,
              status: { in: ACTIVE_BOOKING_STATUSES },
              startDate: { lt: checkOut },
              endDate: { gt: checkIn },
            },
            select: { id: true },
          });
          if (!occupied) {
            room = candidate;
            selectedHotelRoomId = candidate.id;
            break;
          }
        }
        if (!room)
          throw new BadRequestException(
            'No rooms are available for these dates',
          );
      }
      if (room) {
        if (!room.isAvailable)
          throw new BadRequestException('Hotel room is not available');
        if (
          room.capacity < dto.guests ||
          (room.roomType && room.roomType.capacity < dto.guests)
        ) {
          throw new BadRequestException(
            'Guest count exceeds the selected room capacity',
          );
        }
      }

      await this.availabilityService.assertRangeAvailable(
        transaction,
        propertyId,
        listing.id,
        selectedHotelRoomId,
        hostelRoomId,
        hostelBedId,
        checkIn,
        checkOut,
      );

      const overlap = await transaction.booking.findFirst({
        where: {
          OR: [
            ...(selectedHotelRoomId
              ? [{ hotelRoomId: selectedHotelRoomId }]
              : []),
            ...(hostelBedId ? [{ hostelBedId }] : []),
            ...(selectedHotelRoomId || hostelBedId
              ? [
                  {
                    propertyId,
                    hotelRoomId: null,
                    hostelBedId: null,
                  },
                ]
              : [{ propertyId }]),
          ],
          status: { in: ACTIVE_BOOKING_STATUSES },
          startDate: { lt: checkOut },
          endDate: { gt: checkIn },
        },
        select: { id: true },
      });
      if (overlap)
        throw new BadRequestException(
          'Property or selected unit is already booked for these dates',
        );

      const nights = (checkOut.getTime() - checkIn.getTime()) / 86_400_000;
      const nightlyPrice =
        room?.roomType?.price ?? room?.basePrice ?? property.price;
      const totalAmount = nightlyPrice * nights;
      return transaction.booking.create({
        data: {
          tenantId,
          propertyId,
          listingId: listing.id,
          hotelRoomId: selectedHotelRoomId,
          hostelBedId,
          startDate: checkIn,
          endDate: checkOut,
          guests: dto.guests,
          totalAmount,
          status: 'PAYMENT_PENDING' as BookingStatus,
        },
        include: this.bookingInclude(),
      });
    });

    const bookingRecord: unknown = booking;
    const bookingAccess = bookingRecord as BookingAccessProjection;
    const ownerId =
      bookingAccess.property?.ownerId ?? bookingAccess.listing?.landlordId;
    if (!ownerId)
      throw new BadRequestException('Booking owner could not be resolved');
    await this.notificationsService.create({
      userId: ownerId,
      type: 'NEW_BOOKING' as NotificationType,
      title: 'New booking request',
      message: 'A tenant submitted a booking request for your property',
      data: { bookingId: bookingAccess.id, propertyId },
    });
    return booking as unknown;
  }

  myBookings(tenantId: string) {
    return this.prisma.booking.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: this.bookingInclude(),
    });
  }

  async findById(id: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: this.bookingInclude(),
    });
    if (!booking) throw new NotFoundException('Booking not found');
    this.assertParticipantOrOwner(
      booking as unknown as BookingAccessProjection,
      userId,
    );
    return booking;
  }

  async propertyBookings(propertyId: string, ownerId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true, managers: { select: { userId: true } } },
    });
    if (!property) throw new NotFoundException('Property not found');
    if (
      property.ownerId !== ownerId &&
      !property.managers.some((manager) => manager.userId === ownerId)
    ) {
      throw new ForbiddenException(
        'Only the property owner or manager can view bookings',
      );
    }
    return this.prisma.booking.findMany({
      where: { propertyId },
      orderBy: { startDate: 'asc' },
      include: this.bookingInclude(),
    });
  }

  async cancel(id: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        property: { select: { ownerId: true, title: true } },
        listing: { select: { landlordId: true } },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    const bookingRecord: unknown = booking;
    const bookingAccess = bookingRecord as BookingAccessProjection;
    const ownerId =
      bookingAccess.property?.ownerId ?? bookingAccess.listing?.landlordId;
    if (bookingAccess.tenantId !== userId && ownerId !== userId) {
      throw new ForbiddenException(
        'Only the tenant or property owner can cancel this booking',
      );
    }
    if (!ACTIVE_BOOKING_STATUSES.includes(booking.status)) {
      throw new BadRequestException('This booking cannot be cancelled');
    }
    const updated: unknown = await this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CANCELLED, cancelledAt: new Date() },
      include: this.bookingInclude(),
    });
    const recipientId =
      bookingAccess.tenantId === userId ? ownerId : bookingAccess.tenantId;
    if (recipientId) {
      await this.notificationsService.create({
        userId: recipientId,
        type: 'BOOKING_CANCELLED' as NotificationType,
        title: 'Booking cancelled',
        message: 'A booking was cancelled',
        data: { bookingId: id, propertyId: bookingAccess.propertyId },
      });
    }
    return updated;
  }

  private assertParticipantOrOwner(
    booking: BookingAccessProjection,
    userId: string,
  ) {
    const ownerId = booking.property?.ownerId ?? booking.listing?.landlordId;
    const managerIds =
      booking.property?.managers?.map((manager) => manager.userId) ?? [];
    if (
      booking.tenantId !== userId &&
      ownerId !== userId &&
      !managerIds.includes(userId)
    ) {
      throw new ForbiddenException('You cannot access this booking');
    }
  }

  private bookingInclude() {
    return {
      tenant: { select: { id: true, fullName: true } },
      property: {
        select: {
          id: true,
          ownerId: true,
          title: true,
          city: true,
          area: true,
          price: true,
          managers: { select: { userId: true } },
        },
      },
      listing: {
        select: {
          id: true,
          title: true,
          landlordId: true,
          city: true,
          area: true,
        },
      },
      hotelRoom: {
        select: {
          id: true,
          roomNumber: true,
          capacity: true,
          basePrice: true,
          roomType: {
            select: {
              id: true,
              name: true,
              capacity: true,
              price: true,
              amenities: true,
            },
          },
        },
      },
      hostelBed: {
        select: {
          id: true,
          bedNumber: true,
          room: { select: { roomNumber: true } },
        },
      },
    } satisfies Prisma.BookingInclude;
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
}
