import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PropertyStatus, PropertyType } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';

@Injectable()
export class RoomTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(propertyId: string, userId: string, dto: CreateRoomTypeDto) {
    await this.assertCanManage(propertyId, userId);
    const roomType = await this.prisma
      .$transaction(async (transaction) => {
        await this.lockPropertyInventory(transaction, propertyId);
        const hotel = await this.ensureHotel(transaction, propertyId);
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
        const existingRooms = await transaction.hotelRoom.findMany({
          where: { hotelId: hotel.id },
          select: { roomNumber: true },
        });
        await transaction.hotelRoom.createMany({
          data: this.generateRoomNumbers(
            dto.name.trim(),
            dto.numberOfRooms,
            existingRooms.map((room) => room.roomNumber),
          ).map((roomNumber) => ({
            hotelId: hotel.id,
            roomTypeId: created.id,
            roomNumber,
            capacity: dto.capacity,
            basePrice: dto.price,
          })),
        });
        return created;
      })
      .catch((error: unknown) => {
        this.throwRoomTypeConflict(error);
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
    const ownedRoomType = await this.getOwnedRoomType(id, userId);
    await this.prisma
      .$transaction(async (transaction) => {
        await this.lockPropertyInventory(
          transaction,
          ownedRoomType.hotel.propertyId,
        );
        const roomType = await transaction.roomType.findUnique({
          where: { id },
        });
        if (!roomType) throw new NotFoundException('Room type not found');

        const targetCount = dto.numberOfRooms ?? roomType.numberOfRooms;
        if (targetCount < 1)
          throw new BadRequestException('numberOfRooms must be at least 1');

        const rooms = await transaction.hotelRoom.findMany({
          where: { roomTypeId: id },
          orderBy: { roomNumber: 'asc' },
          include: {
            bookings: {
              where: {
                status: {
                  in: ['PENDING', 'PAYMENT_PENDING', 'HELD', 'CONFIRMED'],
                },
              },
              select: { id: true, guests: true },
            },
          },
        });
        const targetCapacity = dto.capacity ?? roomType.capacity;
        if (
          dto.capacity !== undefined &&
          rooms.some((room) =>
            room.bookings.some((booking) => booking.guests > targetCapacity),
          )
        ) {
          throw new BadRequestException(
            'Cannot reduce capacity below the guest count of an active booking',
          );
        }

        if (targetCount < rooms.length) {
          const roomsToRemove = rooms.length - targetCount;
          const removableRooms = rooms
            .filter((room) => room.bookings.length === 0)
            .slice(0, roomsToRemove);
          if (removableRooms.length !== roomsToRemove) {
            throw new BadRequestException(
              'Cannot remove rooms with active bookings',
            );
          }
          await transaction.hotelRoom.deleteMany({
            where: { id: { in: removableRooms.map((room) => room.id) } },
          });
        } else if (targetCount > rooms.length) {
          const existingRooms = await transaction.hotelRoom.findMany({
            where: { hotelId: roomType.hotelId },
            select: { roomNumber: true },
          });
          const roomNumbers = this.generateRoomNumbers(
            dto.name?.trim() ?? roomType.name,
            targetCount - rooms.length,
            existingRooms.map((room) => room.roomNumber),
          );
          await transaction.hotelRoom.createMany({
            data: roomNumbers.map((roomNumber) => ({
              hotelId: roomType.hotelId,
              roomTypeId: id,
              roomNumber,
              capacity: targetCapacity,
              basePrice: dto.price ?? roomType.price,
            })),
          });
        }

        await transaction.roomType.update({
          where: { id },
          data: {
            ...(dto.name !== undefined && { name: dto.name.trim() }),
            ...(dto.capacity !== undefined && { capacity: dto.capacity }),
            ...(dto.price !== undefined && { price: dto.price }),
            numberOfRooms: targetCount,
            ...(dto.amenities !== undefined && { amenities: dto.amenities }),
          },
        });
        if (dto.capacity !== undefined || dto.price !== undefined) {
          await transaction.hotelRoom.updateMany({
            where: { roomTypeId: id },
            data: {
              ...(dto.capacity !== undefined && { capacity: dto.capacity }),
              ...(dto.price !== undefined && { basePrice: dto.price }),
            },
          });
        }
      })
      .catch((error: unknown) => {
        this.throwRoomTypeConflict(error);
      });
    return this.findById(id, userId);
  }

  async remove(id: string, userId: string) {
    const roomType = await this.getOwnedRoomType(id, userId);
    await this.prisma.$transaction(async (transaction) => {
      await this.lockPropertyInventory(transaction, roomType.hotel.propertyId);
      const activeBooking = await transaction.booking.findFirst({
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
      await transaction.hotelRoom.deleteMany({ where: { roomTypeId: id } });
      await transaction.roomType.delete({ where: { id } });
    });
    return { id, deleted: true };
  }

  private async findById(id: string, userId: string) {
    await this.getOwnedRoomType(id, userId);
    return this.prisma.roomType.findUnique({
      where: { id },
      include: { rooms: { orderBy: { roomNumber: 'asc' } } },
    });
  }

  private async ensureHotel(
    transaction: Prisma.TransactionClient,
    propertyId: string,
  ) {
    const property = await transaction.property.findUnique({
      where: { id: propertyId },
      select: { propertyType: true, hotel: true },
    });
    if (!property) throw new NotFoundException('Property not found');
    if (
      property.propertyType !== PropertyType.HOTEL &&
      property.propertyType !== PropertyType.GUEST_HOUSE
    ) {
      throw new BadRequestException(
        'Room types are only available for hotels and guest houses',
      );
    }
    return property.hotel ?? transaction.hotel.create({ data: { propertyId } });
  }

  private async lockPropertyInventory(
    transaction: Prisma.TransactionClient,
    propertyId: string,
  ) {
    await transaction.$queryRaw(
      Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${propertyId}))`,
    );
  }

  private generateRoomNumbers(
    roomTypeName: string,
    count: number,
    existingRoomNumbers: string[],
  ) {
    const used = new Set(existingRoomNumbers);
    const roomNumbers: string[] = [];
    for (let suffix = 1; roomNumbers.length < count; suffix += 1) {
      const roomNumber = `${roomTypeName} ${suffix}`;
      if (!used.has(roomNumber)) {
        used.add(roomNumber);
        roomNumbers.push(roomNumber);
      }
    }
    return roomNumbers;
  }

  private throwRoomTypeConflict(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'A room type or room number with these details already exists',
      );
    }
    throw error;
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
