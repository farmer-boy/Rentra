import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RegisterDto, Role } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException('Yeh email pehle se registered hai');
    }

    const existingPhone = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    if (existingPhone) {
      throw new ConflictException('Yeh phone number pehle se registered hai');
    }

    const existingCnic = await this.prisma.user.findUnique({
      where: { cnic: dto.cnic },
    });
    if (existingCnic) {
      throw new ConflictException('Yeh CNIC pehle se registered hai');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        cnic: dto.cnic,
        password: hashedPassword,
        role: dto.role ?? Role.TENANT,
      },
    });

    const accessToken = this.generateToken(user.id, user.email, user.role);

    return {
      message: 'Registration successful! Rentra mein khush amdeed 🎉',
      user: this.sanitizeUser(user),
      accessToken,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email ya password galat hai');
    }

    if (user.isSuspended) {
      throw new UnauthorizedException(
        'Aapka account suspend kar diya gaya hai',
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ya password galat hai');
    }

    const accessToken = this.generateToken(user.id, user.email, user.role);

    return {
      message: 'Login successful! Welcome back 👋',
      user: this.sanitizeUser(user),
      accessToken,
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        cnic: true,
        role: true,
        trustScore: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User nahi mila');
    }

    return user;
  }

  private generateToken(userId: string, email: string, role: string) {
    return this.jwtService.sign({
      sub: userId,
      email,
      role,
    });
  }

  private sanitizeUser(user: User) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = user;
    return safeUser;
  }
}
