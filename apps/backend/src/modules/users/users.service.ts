import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TrustSource } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUserDto, Role } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateLandlordProfileDto } from './dto/create-landlord-profile.dto';
import { UpdateLandlordProfileDto } from './dto/update-landlord-profile.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import * as bcrypt from 'bcryptjs';
import { TrustScoreService } from '../trust-score/trust-score.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private readonly trustScoreService: TrustScoreService,
  ) {}

  async createAuthAccount(data: {
    fullName: string;
    email: string;
    phone: string;
    cnic?: string;
    password: string;
    role?: Role.TENANT | Role.LANDLORD;
  }) {
    const { role = Role.TENANT, ...accountData } = data;
    return this.prisma.user.create({
      data: {
        ...accountData,
        roles: [role],
      },
    });
  }

  async findForAuthentication(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async getAuthenticatedUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        cnic: true,
        roles: true,
        trustScore: true,
        emailVerifiedAt: true,
        isSuspended: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { ...user, isVerified: user.emailVerifiedAt !== null };
  }

  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        roles: true,
        trustScore: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        createdAt: true,
        profile: { select: { bio: true, avatarUrl: true } },
        verificationSubmissions: {
          where: { kind: 'IDENTITY' },
          orderBy: { submittedAt: 'desc' },
          take: 1,
          select: { status: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      bio: user.profile?.bio ?? null,
      avatarUrl: user.profile?.avatarUrl ?? null,
      roles: user.roles,
      verificationStatus:
        user.verificationSubmissions[0]?.status ??
        (user.emailVerifiedAt ? 'EMAIL_VERIFIED' : 'UNVERIFIED'),
      isVerified: user.emailVerifiedAt !== null,
      emailVerified: user.emailVerifiedAt !== null,
      phoneVerified: user.phoneVerifiedAt !== null,
      identityVerificationStatus:
        user.verificationSubmissions[0]?.status ?? 'UNVERIFIED',
      trustScore: user.trustScore,
      createdAt: user.createdAt,
    };
  }

  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        roles: true,
        trustScore: true,
        emailVerifiedAt: true,
        createdAt: true,
        profile: { select: { bio: true, avatarUrl: true } },
        verificationSubmissions: {
          where: { kind: 'IDENTITY' },
          orderBy: { submittedAt: 'desc' },
          take: 1,
          select: { status: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      fullName: user.fullName,
      bio: user.profile?.bio ?? null,
      avatarUrl: user.profile?.avatarUrl ?? null,
      roles: user.roles,
      verificationStatus:
        user.verificationSubmissions[0]?.status ??
        (user.emailVerifiedAt ? 'EMAIL_VERIFIED' : 'UNVERIFIED'),
      isVerified: user.emailVerifiedAt !== null,
      emailVerified: user.emailVerifiedAt !== null,
      identityVerificationStatus:
        user.verificationSubmissions[0]?.status ?? 'UNVERIFIED',
      trustScore: user.trustScore,
      createdAt: user.createdAt,
    };
  }

  async updateMyProfile(userId: string, dto: UpdateMyProfileDto) {
    if (Object.values(dto).every((value) => value === undefined)) {
      throw new BadRequestException(
        'Provide at least one profile field to update',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, phone: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userData: Prisma.UserUpdateInput = {};
    if (dto.fullName !== undefined) userData.fullName = dto.fullName;
    if (dto.email !== undefined && dto.email !== user.email) {
      userData.email = dto.email;
      userData.emailVerifiedAt = null;
      userData.isVerified = false;
    }
    if (dto.phone !== undefined && dto.phone !== user.phone) {
      userData.phone = dto.phone;
      userData.phoneVerifiedAt = null;
    }

    const profileCreate = {
      userId,
      bio: dto.bio ?? null,
      avatarUrl: dto.avatarUrl ?? null,
    };
    const profileUpdate: Prisma.UserProfileUpdateInput = {};
    if (dto.bio !== undefined) profileUpdate.bio = dto.bio;
    if (dto.avatarUrl !== undefined) profileUpdate.avatarUrl = dto.avatarUrl;

    try {
      await this.prisma.$transaction(async (transaction) => {
        if (Object.keys(userData).length > 0) {
          await transaction.user.update({
            where: { id: userId },
            data: userData,
          });
          if (userData.email !== undefined) {
            await transaction.verificationToken.deleteMany({
              where: { userId },
            });
          }
        }
        await transaction.userProfile.upsert({
          where: { userId },
          create: profileCreate,
          update: profileUpdate,
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email or phone number is already in use');
      }
      throw error;
    }

    if (
      (dto.email !== undefined && dto.email !== user.email) ||
      (dto.phone !== undefined && dto.phone !== user.phone)
    ) {
      await this.trustScoreService.recalculateForUser(
        userId,
        TrustSource.VERIFICATION,
        'Contact details changed; verification status reset',
      );
    }

    return this.getMyProfile(userId);
  }

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

    const roles =
      dto.roles && dto.roles.length > 0
        ? dto.roles
        : dto.role
          ? [dto.role]
          : [Role.TENANT, Role.LANDLORD];

    return await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        cnic: dto.cnic ?? null,
        password: hashedPassword,
        roles,
        trustScore: 50,
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

    const roles =
      dto.roles && dto.roles.length > 0
        ? dto.roles
        : dto.role
          ? [dto.role]
          : user.roles;

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        fullName: dto.fullName ?? user.fullName,
        email: dto.email ?? user.email,
        phone: dto.phone ?? user.phone,
        cnic: dto.cnic ?? user.cnic,
        roles,
        isSuspended: dto.isSuspended ?? user.isSuspended,
        ...(dto.email !== undefined &&
          dto.email !== user.email && {
            emailVerifiedAt: null,
            isVerified: false,
          }),
        ...(dto.phone !== undefined &&
          dto.phone !== user.phone && { phoneVerifiedAt: null }),
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
    if (
      (dto.email !== undefined && dto.email !== user.email) ||
      (dto.phone !== undefined && dto.phone !== user.phone)
    ) {
      await this.prisma.verificationToken.deleteMany({ where: { userId: id } });
      await this.trustScoreService.recalculateForUser(
        id,
        TrustSource.VERIFICATION,
        'Contact details changed; verification status reset',
      );
    }
    return updatedUser;
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
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!user) throw new BadRequestException('User not found');
    throw new ConflictException(
      'Use the email confirmation or administrator verification submission workflow',
    );
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

  async createLandlordProfile(userId: string, dto: CreateLandlordProfileDto) {
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

  async updateLandlordProfile(userId: string, dto: UpdateLandlordProfileDto) {
    await this.getLandlordProfile(userId);

    return this.prisma.landlordProfile.update({
      where: { userId },
      data: dto,
    });
  }
}
