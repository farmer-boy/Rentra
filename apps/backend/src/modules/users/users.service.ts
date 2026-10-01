import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUserDto, Role } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateLandlordProfileDto } from './dto/create-landlord-profile.dto';
import { UpdateLandlordProfileDto } from './dto/update-landlord-profile.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { phone: dto.phone }, { cnic: dto.cnic }],
      },
    });

    if (existingUser) {
      throw new BadRequestException(
        'User already exists with this email, phone, or CNIC',
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const roles = dto.roles && dto.roles.length > 0 ? dto.roles : dto.role ? [dto.role] : [Role.TENANT, Role.LANDLORD];

    return await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        cnic: dto.cnic ?? null,
        password: hashedPassword,
        roles,
        trustScore: dto.trustScore || 50,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        cnic: true,
        roles: true,
        trustScore: true,
        isVerified: true,
        isSuspended: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findAll() {
    return await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        roles: true,
        trustScore: true,
        isVerified: true,
        isSuspended: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        cnic: true,
        roles: true,
        trustScore: true,
        isVerified: true,
        isSuspended: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        roles: true,
        trustScore: true,
        isVerified: true,
        isSuspended: true,
      },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check for unique constraints if email, phone, or cnic are being updated
    if (dto.email && dto.email !== user.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new BadRequestException('Email already exists');
      }
    }

    if (dto.phone && dto.phone !== user.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (existingPhone) {
        throw new BadRequestException('Phone number already exists');
      }
    }

    if (dto.cnic !== undefined && dto.cnic !== user.cnic) {
      const existingCnic = await this.prisma.user.findUnique({
        where: { cnic: dto.cnic },
      });
      if (existingCnic) {
        throw new BadRequestException('CNIC already exists');
      }
    }

    const roles = dto.roles && dto.roles.length > 0 ? dto.roles : dto.role ? [dto.role] : user.roles;

    return await this.prisma.user.update({
      where: { id },
      data: {
        fullName: dto.fullName ?? user.fullName,
        email: dto.email ?? user.email,
        phone: dto.phone ?? user.phone,
        cnic: dto.cnic ?? user.cnic,
        roles,
        trustScore: dto.trustScore ?? user.trustScore,
        isVerified: dto.isVerified ?? user.isVerified,
        isSuspended: dto.isSuspended ?? user.isSuspended,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        cnic: true,
        roles: true,
        trustScore: true,
        isVerified: true,
        isSuspended: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateTrustScore(id: string, score: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const newScore = Math.min(100, Math.max(0, user.trustScore + score));

    return await this.prisma.user.update({
      where: { id },
      data: { trustScore: newScore },
      select: {
        id: true,
        email: true,
        fullName: true,
        trustScore: true,
        updatedAt: true,
      },
    });
  }

  async suspend(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return await this.prisma.user.update({
      where: { id },
      data: { isSuspended: true },
      select: {
        id: true,
        email: true,
        fullName: true,
        isSuspended: true,
        updatedAt: true,
      },
    });
  }

  async unsuspend(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return await this.prisma.user.update({
      where: { id },
      data: { isSuspended: false },
      select: {
        id: true,
        email: true,
        fullName: true,
        isSuspended: true,
        updatedAt: true,
      },
    });
  }

  async verify(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return await this.prisma.user.update({
      where: { id },
      data: { isVerified: true },
      select: {
        id: true,
        email: true,
        fullName: true,
        isVerified: true,
        updatedAt: true,
      },
    });
  }

  async delete(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return await this.prisma.user.delete({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });
  }

  async createLandlordProfile(
    userId: string,
    dto: CreateLandlordProfileDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, roles: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingProfile = await this.prisma.landlordProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw new ConflictException('Landlord profile already exists');
    }

    const roles = user.roles.includes(Role.LANDLORD)
      ? user.roles
      : [...user.roles, Role.LANDLORD];

    const [profile] = await this.prisma.$transaction([
      this.prisma.landlordProfile.create({
        data: {
          userId,
          displayName: dto.displayName,
          bio: dto.bio,
          avatarUrl: dto.avatarUrl,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { roles },
      }),
    ]);

    return profile;
  }

  async getLandlordProfile(userId: string) {
    const profile = await this.prisma.landlordProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Landlord profile not found');
    }

    return profile;
  }

  async updateLandlordProfile(
    userId: string,
    dto: UpdateLandlordProfileDto,
  ) {
    await this.getLandlordProfile(userId);

    return this.prisma.landlordProfile.update({
      where: { userId },
      data: dto,
    });
  }
}
