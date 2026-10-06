import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PropertyStatus, PropertyType } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';

@Injectable()
export class RoomTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(propertyId: string, userId: string, dto: CreateRoomTypeDto) {
    await this.assertCanManage(propertyId, userId);
    const hotel = await this.ensureHotel(propertyId);
    const roomType = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.roomType.create({
        data: {
          hotelId: hotel.id,
          name: dto.name.trim(),
          capacity: dto.capacity,
          price: dto.price,
          numberOfRooms: dto.numberOfRooms,
          amenities: dto.amenities ?? [],
        },
      });
      await transaction.hotelRoom.createMany({
        data: Array.from({ length: dto.numberOfRooms }, (_, index) => ({
          hotelId: hotel.id,
          roomTypeId: created.id,
          roomNumber: `${dto.name.trim()} ${index + 1}`,
          capacity: dto.capacity,
          basePrice: dto.price,
        })),
      });
      return created;
    });
    return this.findById(roomType.id, userId);
  }

  async list(propertyId: string, userId: string) {
    await this.assertCanView(propertyId, userId);
    const hotel = await this.prisma.hotel.findUnique({
      where: { propertyId },
      select: { id: true },
    });
    if (!hotel) return [];
    return this.prisma.roomType.findMany({
      where: { hotelId: hotel.id },
      orderBy: { name: 'asc' },
      include: {
        rooms: {
          select: {
            id: true,
            roomNumber: true,
            capacity: true,
            basePrice: true,
            isAvailable: true,
          },
          orderBy: { roomNumber: 'asc' },
        },
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateRoomTypeDto) {
    await this.getOwnedRoomType(id, userId);
    const targetCount = dto.numberOfRooms ?? roomType.numberOfRooms;
    if (targetCount < 1)
      throw new BadRequestException('numberOfRooms must be at least 1');

    return this.prisma
      .$transaction(async (transaction) => {
        const updated = await transaction.roomType.update({
          where: { id },
          data: {
            ...(dto.name !== undefined && { name: dto.name.trim() }),
            ...(dto.capacity !== undefined && { capacity: dto.capacity }),
            ...(dto.price !== undefined && { price: dto.price }),
            ...(dto.numberOfRooms !== undefined && {
              numberOfRooms: dto.numberOfRooms,
            }),
            ...(dto.amenities !== undefined && { amenities: dto.amenities }),
          },
        });
        const rooms = await transaction.hotelRoom.findMany({
          where: { roomTypeId: id },
          orderBy: { roomNumber: 'desc' },
          include: {
            bookings: {
              where: {
                status: {
                  in: ['PENDING', 'PAYMENT_PENDING', 'HELD', 'CONFIRMED'],
                },
              },
              select: { id: true },
            },
          },
        });
        if (targetCount < rooms.length) {
          const removable = rooms.slice(0, rooms.length - targetCount);
          if (removable.some((room) => room.bookings.length)) {
            throw new BadRequestException(
              'Cannot remove rooms with active bookings',
            );
          }
          await transaction.hotelRoom.deleteMany({
            where: { id: { in: removable.map((room) => room.id) } },
          });
        } else if (targetCount > rooms.length) {
          await transaction.hotelRoom.createMany({
            data: Array.from(
              { length: targetCount - rooms.length },
              (_, index) => ({
                hotelId: roomType.hotelId,
                roomTypeId: id,
                roomNumber: `${dto.name?.trim() ?? roomType.name} ${rooms.length + index + 1}`,
                capacity: dto.capacity ?? roomType.capacity,
                basePrice: dto.price ?? roomType.price,
              }),
            ),
          });
        }
        if (dto.capacity !== undefined || dto.price !== undefined) {
          await transaction.hotelRoom.updateMany({
            where: { roomTypeId: id },
            data: {
              ...(dto.capacity !== undefined && { capacity: dto.capacity }),
              ...(dto.price !== undefined && { basePrice: dto.price }),
            },
          });
        }
        return updated;
      })
      .then(() => this.findById(id, userId));
  }

  async remove(id: string, userId: string) {
    const roomType = await this.getOwnedRoomType(id, userId);
    const activeBooking = await this.prisma.booking.findFirst({
      where: {
        hotelRoom: { roomTypeId: id },
        status: { in: ['PENDING', 'PAYMENT_PENDING', 'HELD', 'CONFIRMED'] },
      },
      select: { id: true },
    });
    if (activeBooking)
      throw new BadRequestException(
        'Cannot delete a room type with active bookings',
      );
    await this.prisma.roomType.delete({ where: { id } });
    return { id, deleted: true };
  }

  private async findById(id: string, userId: string) {
    await this.getOwnedRoomType(id, userId);
    return this.prisma.roomType.findUnique({
      where: { id },
      include: { rooms: { orderBy: { roomNumber: 'asc' } } },
    });
  }

  private async ensureHotel(propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { propertyType: true, hotel: true },
    });
    if (!property) throw new NotFoundException('Property not found');
    if (
      ![PropertyType.HOTEL, PropertyType.GUEST_HOUSE].includes(
        property.propertyType,
      )
    ) {
      throw new BadRequestException(
        'Room types are only available for hotels and guest houses',
      );
    }
    return property.hotel ?? this.prisma.hotel.create({ data: { propertyId } });
  }

  private async getOwnedRoomType(id: string, userId: string) {
    const roomType = await this.prisma.roomType.findUnique({
      where: { id },
      include: {
        hotel: { include: { property: { include: { managers: true } } } },
      },
    });
    if (!roomType) throw new NotFoundException('Room type not found');
    const property = roomType.hotel.property;
    if (
      property.ownerId !== userId &&
      !property.managers.some((manager) => manager.userId === userId)
    ) {
      throw new ForbiddenException(
        'Only the property owner or manager can manage room types',
      );
    }
    return roomType;
  }

  private async assertCanManage(propertyId: string, userId: string) {
    const property = await this.prisma.property.findFirst({
      where: {
        id: propertyId,
        OR: [{ ownerId: userId }, { managers: { some: { userId } } }],
      },
      select: { id: true },
    });
    if (!property)
      throw new ForbiddenException(
        'Only the property owner or manager can manage room types',
      );
  }

  private async assertCanView(propertyId: string, userId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { status: true },
    });
    if (!property) throw new NotFoundException('Property not found');
    if (property.status !== PropertyStatus.ACTIVE)
      await this.assertCanManage(propertyId, userId);
  }
}
