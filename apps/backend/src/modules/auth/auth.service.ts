import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { EmailService } from './email.service';
import { createHash, randomBytes } from 'crypto';

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type AuthTokenUser = Pick<User, 'id' | 'email' | 'roles'>;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private usersService: UsersService,
  ) {}

  async register(dto: RegisterDto) {
    if (await this.usersService.findForAuthentication(dto.email)) {
      throw new ConflictException('This email is already registered');
    }

    const existingPhone = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    if (existingPhone) {
      throw new ConflictException('This phone number is already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    let user: User;
    try {
      user = await this.usersService.createAuthAccount({
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        password: hashedPassword,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'An account already exists with this email or phone',
        );
      }
      throw error;
    }

    const token = randomBytes(32).toString('hex');
    await this.prisma.verificationToken.create({
      data: {
        email: user.email,
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });

    try {
      await this.emailService.sendVerificationEmail(user.email, token);
    } catch (error) {
      console.error('Verification email failed:', error);
    }

    const tokens = await this.issueTokens(user);

    return {
      message: 'Registration successful',
      user: this.sanitizeUser(user),
      ...tokens,
      emailVerificationRequired: true,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findForAuthentication(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.isSuspended) {
      throw new UnauthorizedException('Your account has been suspended');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      message: 'Login successful',
      user: this.sanitizeUser(user),
      ...(await this.issueTokens(user)),
    };
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const now = new Date();
    const nextRefreshToken = randomBytes(48).toString('base64url');
    const nextTokenHash = this.hashRefreshToken(nextRefreshToken);
    const expiresAt = new Date(now.getTime() + REFRESH_TOKEN_TTL_MS);

    const user = await this.prisma.$transaction(async (transaction) => {
      const storedToken = await transaction.refreshToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (
        !storedToken ||
        storedToken.revokedAt ||
        storedToken.expiresAt <= now
      ) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }
      if (storedToken.user.isSuspended) {
        throw new UnauthorizedException('Your account has been suspended');
      }

      const revoked = await transaction.refreshToken.updateMany({
        where: { id: storedToken.id, revokedAt: null, expiresAt: { gt: now } },
        data: { revokedAt: now },
      });
      if (revoked.count !== 1) {
        throw new UnauthorizedException('Refresh token has already been used');
      }

      await transaction.refreshToken.create({
        data: {
          userId: storedToken.userId,
          tokenHash: nextTokenHash,
          expiresAt,
        },
      });

      return storedToken.user;
    });

    return {
      accessToken: await this.generateAccessToken(user),
      refreshToken: nextRefreshToken,
      tokenType: 'Bearer',
    };
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash: this.hashRefreshToken(refreshToken),
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    return { message: 'Logged out successfully' };
  }

  async verifyEmail(token: string) {
    const verificationToken = await this.prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (verificationToken.expiresAt < new Date()) {
      throw new BadRequestException('Verification token has expired');
    }

    await this.prisma.user.update({
      where: { id: verificationToken.userId },
      data: { isVerified: true },
    });

    await this.prisma.verificationToken.delete({
      where: { token },
    });

    return { message: 'Email verified successfully' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('No account found with this email');
    }

    const token = randomBytes(32).toString('hex');
    await this.prisma.resetPasswordToken.create({
      data: {
        email: user.email,
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 1),
      },
    });

    await this.emailService.sendPasswordResetEmail(user.email, token);
    return { message: 'Password reset email sent' };
  }

  async resetPassword(token: string, password: string) {
    const resetToken = await this.prisma.resetPasswordToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await this.prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    await this.prisma.resetPasswordToken.delete({
      where: { token },
    });

    return { message: 'Password reset successfully' };
  }

  async getMe(userId: string) {
    return this.usersService.getAuthenticatedUser(userId);
  }

  private async issueTokens(user: User) {
    const refreshToken = randomBytes(48).toString('base64url');
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashRefreshToken(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });

    return {
      accessToken: await this.generateAccessToken(user),
      refreshToken,
      tokenType: 'Bearer',
    };
  }

  private generateAccessToken(user: AuthTokenUser) {
    return this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      roles: user.roles,
      role: user.roles[0],
    });
  }

  private hashRefreshToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private sanitizeUser(user: User) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      cnic: user.cnic,
      roles: user.roles,
      trustScore: user.trustScore,
      isVerified: user.isVerified,
      isSuspended: user.isSuspended,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
