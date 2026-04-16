import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
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

    return await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        cnic: dto.cnic,
        password: hashedPassword,
        role: dto.role || 'TENANT',
        trustScore: dto.trustScore || 50,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        cnic: true,
        role: true,
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
        role: true,
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
        role: true,
        trustScore: true,
        isVerified: true,
        isSuspended: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User nahi mila');
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
        role: true,
        trustScore: true,
        isVerified: true,
        isSuspended: true,
      },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new BadRequestException('User nahi mila');
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

    if (dto.cnic && dto.cnic !== user.cnic) {
      const existingCnic = await this.prisma.user.findUnique({
        where: { cnic: dto.cnic },
      });
      if (existingCnic) {
        throw new BadRequestException('CNIC already exists');
      }
    }

    return await this.prisma.user.update({
      where: { id },
      data: {
        fullName: dto.fullName ?? user.fullName,
        email: dto.email ?? user.email,
        phone: dto.phone ?? user.phone,
        cnic: dto.cnic ?? user.cnic,
        role: dto.role ?? user.role,
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
        role: true,
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
      throw new BadRequestException('User nahi mila');
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
      throw new BadRequestException('User nahi mila');
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
      throw new BadRequestException('User nahi mila');
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
      throw new BadRequestException('User nahi mila');
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
      throw new BadRequestException('User nahi mila');
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
}
