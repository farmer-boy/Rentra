import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  Prisma,
  Role,
  TrustSource,
  User,
  VerificationChallengeKind,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { EmailService } from './email.service';
import {
  createHash,
  createHmac,
  createPublicKey,
  randomBytes,
  randomInt,
  verify as verifySignature,
} from 'crypto';
import { TrustScoreService } from '../trust-score/trust-score.service';
import { VerifyRegistrationDto } from './dto/verify-registration.dto';
import { GoogleLoginDto } from './dto/google-login.dto';

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const LOGIN_CODE_TTL_MS = 10 * 60 * 1000;
const LOGIN_CODE_ATTEMPT_LIMIT = 5;
const LOGIN_CODE_SEND_LIMIT = 3;
const LOGIN_CODE_SEND_WINDOW_MS = 15 * 60 * 1000;

type AuthTokenUser = Pick<User, 'id' | 'email' | 'roles'>;
type GoogleJwk = JsonWebKey & { kid: string; [key: string]: unknown };
type GoogleIdTokenClaims = {
  aud: string | string[];
  email: string;
  email_verified: boolean | 'true' | 'false';
  exp: number;
  iss: string;
};

@Injectable()
export class AuthService {
  private googleJwksCache: { keys: GoogleJwk[]; expiresAt: number } | null = null;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private usersService: UsersService,
    private trustScoreService: TrustScoreService,
  ) {}

  async register(dto: RegisterDto) {
    await this.prisma.pendingRegistration.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });

    if (await this.usersService.findForAuthentication(dto.email)) {
      throw new ConflictException('This email is already registered');
    }

    const existingPhone = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    if (existingPhone) {
      throw new ConflictException('This phone number is already registered');
    }

    if (dto.cnic) {
      const existingCnic = await this.prisma.user.findUnique({
        where: { cnic: dto.cnic },
      });
      if (existingCnic) {
        throw new ConflictException('This CNIC is already registered');
      }
    }

    // A failed email delivery leaves the unverified pending row in place. If
    // the user corrects their email and retries with the same phone/CNIC,
    // replace that pending row instead of treating their own details as taken.
    const pendingConflicts = await this.prisma.pendingRegistration.findMany({
      where: {
        email: { not: dto.email },
        OR: [
          { phone: dto.phone },
          ...(dto.cnic ? [{ cnic: dto.cnic }] : []),
        ],
      },
      select: { id: true, phone: true, cnic: true },
    });
    const conflictingPendingIds = [...new Set(pendingConflicts.map(({ id }) => id))];
    if (conflictingPendingIds.length > 1) {
      throw new ConflictException(
        'This phone number or CNIC is already used for another pending registration',
      );
    }
    if (conflictingPendingIds.length === 1) {
      await this.prisma.pendingRegistration.deleteMany({
        where: { id: conflictingPendingIds[0] },
      });
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const code = randomInt(100000, 1000000).toString();
    const codeHash = await bcrypt.hash(code, 10);
    const role = dto.role === 'LANDLORD' ? Role.LANDLORD : Role.TENANT;
    try {
      await this.prisma.pendingRegistration.upsert({
        where: { email: dto.email },
        create: {
          fullName: dto.fullName,
          email: dto.email,
          phone: dto.phone,
          cnic: dto.cnic || null,
          password: hashedPassword,
          role,
          codeHash,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
        update: {
          fullName: dto.fullName,
          phone: dto.phone,
          cnic: dto.cnic || null,
          password: hashedPassword,
          role,
          codeHash,
          codeAttempts: 0,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'An account already exists with this email, phone, or CNIC',
        );
      }
      throw error;
    }
    await this.emailService.sendRegistrationCode(dto.email, code);

    return {
      message: 'Verification code sent. Enter it to create your account.',
      email: dto.email,
    };
  }

  async verifyRegistration(dto: VerifyRegistrationDto) {
    const pending = await this.prisma.pendingRegistration.findUnique({
      where: { email: dto.email },
    });
    if (!pending) {
      throw new BadRequestException(
        'No pending registration was found. Please register again.',
      );
    }
    if (pending.expiresAt <= new Date()) {
      await this.prisma.pendingRegistration.deleteMany({
        where: { id: pending.id },
      });
      throw new BadRequestException(
        'Verification code expired. Request a new code.',
      );
    }
    if (pending.codeAttempts >= 5) {
      await this.prisma.pendingRegistration.deleteMany({
        where: { id: pending.id },
      });
      throw new BadRequestException(
        'Too many incorrect codes. Please register again.',
      );
    }
    if (!(await bcrypt.compare(dto.code, pending.codeHash))) {
      await this.prisma.pendingRegistration.updateMany({
        where: { id: pending.id, codeAttempts: { lt: 5 } },
        data: { codeAttempts: { increment: 1 } },
      });
      throw new BadRequestException('Verification code is incorrect.');
    }

    let user: User;
    try {
      user = await this.prisma.$transaction(async (transaction) => {
        const currentPending = await transaction.pendingRegistration.findUnique(
          {
            where: { id: pending.id },
          },
        );
        if (
          !currentPending ||
          currentPending.expiresAt <= new Date() ||
          currentPending.codeHash !== pending.codeHash
        ) {
          throw new BadRequestException(
            'Verification code expired or was already used.',
          );
        }
        const created = await transaction.user.create({
          data: {
            fullName: currentPending.fullName,
            email: currentPending.email,
            phone: currentPending.phone,
            cnic: currentPending.cnic,
            password: currentPending.password,
            roles: [currentPending.role],
            isVerified: true,
            emailVerifiedAt: new Date(),
          },
        });
        await transaction.pendingRegistration.delete({
          where: { id: currentPending.id },
        });
        return created;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'An account already exists with this email, phone, or CNIC',
        );
      }
      throw error;
    }

    await this.trustScoreService.recalculateForUser(
      user.id,
      TrustSource.VERIFICATION,
      'Email verified during account registration',
    );
    const currentUser = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    return {
      message: 'Email verified and account created.',
      user: this.sanitizeUser(currentUser),
      ...(await this.issueTokens(currentUser)),
    };
  }

  async resendRegistrationCode(email: string) {
    const pending = await this.prisma.pendingRegistration.findUnique({
      where: { email },
    });
    if (!pending) {
      throw new BadRequestException(
        'No pending registration was found. Please register again.',
      );
    }
    const code = randomInt(100000, 1000000).toString();
    await this.prisma.pendingRegistration.update({
      where: { id: pending.id },
      data: {
        codeHash: await bcrypt.hash(code, 10),
        codeAttempts: 0,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
    await this.emailService.sendRegistrationCode(email, code);
    return { message: 'A new verification code was sent.' };
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

    await this.sendLoginCode(user);
    return {
      message: 'A sign-in code was sent to your email.',
      email: user.email,
      loginVerificationRequired: true,
    };
  }

  async loginWithGoogle(dto: GoogleLoginDto) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new ServiceUnavailableException(
        'Google sign-in is not configured on the server.',
      );
    }

    const claims = await this.verifyGoogleIdToken(dto.credential, clientId);
    const email = claims.email.trim().toLowerCase();
    const user = await this.usersService.findForAuthentication(email);
    if (!user) {
      throw new UnauthorizedException(
        'No Rentra account exists for this Google email. Create a Rentra account first.',
      );
    }
    if (user.isSuspended) {
      throw new UnauthorizedException('Your account has been suspended');
    }

    let verifiedUser = user;
    if (!user.emailVerifiedAt) {
      verifiedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date(), isVerified: true },
      });
      await this.trustScoreService.recalculateForUser(
        user.id,
        TrustSource.VERIFICATION,
        'Email verified by Google sign-in',
      );
      verifiedUser = await this.prisma.user.findUniqueOrThrow({
        where: { id: user.id },
      });
    }

    return {
      message: 'Login successful',
      user: this.sanitizeUser(verifiedUser),
      ...(await this.issueTokens(verifiedUser)),
    };
  }

  private async verifyGoogleIdToken(token: string, clientId: string) {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Invalid Google sign-in credential.');
    }

    let header: { alg?: string; kid?: string };
    let claims: GoogleIdTokenClaims;
    try {
      header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
      claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    } catch {
      throw new UnauthorizedException('Invalid Google sign-in credential.');
    }
    if (header.alg !== 'RS256' || !header.kid) {
      throw new UnauthorizedException('Invalid Google sign-in credential.');
    }

    const keys = await this.getGoogleJwks();
    const jwk = keys.find((key) => key.kid === header.kid);
    if (!jwk) {
      this.googleJwksCache = null;
      const refreshedKeys = await this.getGoogleJwks();
      const refreshedJwk = refreshedKeys.find((key) => key.kid === header.kid);
      if (!refreshedJwk) {
        throw new UnauthorizedException('Invalid Google sign-in credential.');
      }
      return this.validateGoogleClaims(
        claims,
        parts,
        refreshedJwk,
        clientId,
      );
    }
    return this.validateGoogleClaims(claims, parts, jwk, clientId);
  }

  private validateGoogleClaims(
    claims: GoogleIdTokenClaims,
    parts: string[],
    jwk: GoogleJwk,
    clientId: string,
  ) {
    const signatureIsValid = verifySignature(
      'RSA-SHA256',
      Buffer.from(`${parts[0]}.${parts[1]}`),
      createPublicKey({ key: jwk, format: 'jwk' }),
      Buffer.from(parts[2], 'base64url'),
    );
    const audienceMatches = Array.isArray(claims.aud)
      ? claims.aud.includes(clientId)
      : claims.aud === clientId;
    if (
      !signatureIsValid ||
      !audienceMatches ||
      !['accounts.google.com', 'https://accounts.google.com'].includes(claims.iss) ||
      !claims.email ||
      ![true, 'true'].includes(claims.email_verified) ||
      !Number.isFinite(claims.exp) ||
      claims.exp * 1000 <= Date.now()
    ) {
      throw new UnauthorizedException('Google sign-in could not be verified.');
    }
    return claims;
  }

  private async getGoogleJwks(): Promise<GoogleJwk[]> {
    if (this.googleJwksCache && this.googleJwksCache.expiresAt > Date.now()) {
      return this.googleJwksCache.keys;
    }
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/certs');
      if (!response.ok) throw new Error(`Google returned HTTP ${response.status}`);
      const data = (await response.json()) as { keys?: GoogleJwk[] };
      if (!data.keys?.length) throw new Error('Google signing keys were missing');
      const maxAge = response.headers.get('cache-control')?.match(/max-age=(\d+)/i);
      const cacheMs = maxAge ? Number(maxAge[1]) * 1000 : 60 * 60 * 1000;
      this.googleJwksCache = {
        keys: data.keys,
        expiresAt: Date.now() + cacheMs,
      };
      return data.keys;
    } catch {
      throw new ServiceUnavailableException(
        'Google sign-in is temporarily unavailable. Please try again.',
      );
    }
  }

  async verifyLoginCode(dto: VerifyRegistrationDto) {
    const user = await this.usersService.findForAuthentication(dto.email);
    if (!user || user.isSuspended) {
      throw new UnauthorizedException('Invalid or expired sign-in code');
    }

    const now = new Date();
    const challenge = await this.prisma.verificationChallenge.findFirst({
      where: {
        userId: user.id,
        kind: VerificationChallengeKind.EMAIL_LOGIN,
        target: user.email,
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!challenge || challenge.expiresAt <= now) {
      throw new BadRequestException('Sign-in code is invalid or expired. Sign in again to request a new one.');
    }
    if (challenge.attempts >= LOGIN_CODE_ATTEMPT_LIMIT) {
      throw new HttpException(
        'Too many incorrect codes. Sign in again to request a new code.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const attempt = await this.prisma.verificationChallenge.updateMany({
      where: {
        id: challenge.id,
        consumedAt: null,
        attempts: { lt: LOGIN_CODE_ATTEMPT_LIMIT },
        expiresAt: { gt: now },
      },
      data: { attempts: { increment: 1 } },
    });
    if (attempt.count !== 1) {
      throw new BadRequestException('Sign-in code is invalid or expired');
    }
    if (
      challenge.tokenHash !==
      this.hashLoginCode(user.id, dto.code, challenge.expiresAt)
    ) {
      throw new BadRequestException('Sign-in code is incorrect.');
    }

    await this.prisma.$transaction(async (transaction) => {
      const consumed = await transaction.verificationChallenge.updateMany({
        where: {
          id: challenge.id,
          consumedAt: null,
          expiresAt: { gt: now },
        },
        data: { consumedAt: now },
      });
      if (consumed.count !== 1) {
        throw new ConflictException('Sign-in code has already been used.');
      }
      if (!user.emailVerifiedAt) {
        await transaction.user.updateMany({
          where: { id: user.id, emailVerifiedAt: null },
          data: { emailVerifiedAt: now, isVerified: true },
        });
      }
    });

    if (!user.emailVerifiedAt) {
      await this.trustScoreService.recalculateForUser(
        user.id,
        TrustSource.VERIFICATION,
        'Email verified during sign-in',
      );
    }
    const verifiedUser = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    return {
      message: 'Login successful',
      user: this.sanitizeUser(verifiedUser),
      ...(await this.issueTokens(verifiedUser)),
    };
  }

  private async sendLoginCode(user: User) {
    const now = new Date();
    const sentRecently = await this.prisma.verificationChallenge.count({
      where: {
        userId: user.id,
        kind: VerificationChallengeKind.EMAIL_LOGIN,
        createdAt: { gte: new Date(now.getTime() - LOGIN_CODE_SEND_WINDOW_MS) },
      },
    });
    if (sentRecently >= LOGIN_CODE_SEND_LIMIT) {
      throw new HttpException(
        'Too many sign-in codes requested. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.prisma.verificationChallenge.updateMany({
      where: {
        userId: user.id,
        kind: VerificationChallengeKind.EMAIL_LOGIN,
        consumedAt: null,
      },
      data: { consumedAt: now },
    });
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const expiresAt = new Date(now.getTime() + LOGIN_CODE_TTL_MS);
    const challenge = await this.prisma.verificationChallenge.create({
      data: {
        userId: user.id,
        kind: VerificationChallengeKind.EMAIL_LOGIN,
        target: user.email,
        tokenHash: this.hashLoginCode(user.id, code, expiresAt),
        expiresAt,
      },
    });

    try {
      await this.emailService.sendLoginCode(user.email, code);
    } catch (error) {
      await this.prisma.verificationChallenge.updateMany({
        where: { id: challenge.id, consumedAt: null },
        data: { consumedAt: new Date() },
      });
      throw error;
    }
  }

  private hashLoginCode(userId: string, code: string, expiresAt: Date) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new UnauthorizedException('Login verification is not configured');
    }
    return createHmac('sha256', secret)
      .update(`${userId}:EMAIL_LOGIN:${code}:${expiresAt.getTime()}`)
      .digest('hex');
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
      include: { user: { select: { email: true } } },
    });

    if (!verificationToken) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (
      verificationToken.expiresAt < new Date() ||
      verificationToken.email !== verificationToken.user.email
    ) {
      throw new BadRequestException('Verification token has expired');
    }

    await this.prisma.user.update({
      where: { id: verificationToken.userId },
      data: { isVerified: true, emailVerifiedAt: new Date() },
    });

    await this.prisma.verificationToken.delete({
      where: { token },
    });

    await this.trustScoreService.recalculateForUser(
      verificationToken.userId,
      TrustSource.VERIFICATION,
      'Email verification completed',
    );

    return { message: 'Email verified successfully' };
  }

  async requestEmailVerification(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, emailVerifiedAt: true },
    });
    if (!user) {
      throw new UnauthorizedException('Authenticated user no longer exists');
    }
    if (user.emailVerifiedAt) {
      return { message: 'Email address is already verified' };
    }

    await this.prisma.verificationToken.deleteMany({ where: { userId } });
    const token = randomBytes(32).toString('hex');
    await this.prisma.verificationToken.create({
      data: {
        email: user.email,
        token,
        userId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });
    try {
      await this.emailService.sendVerificationEmail(user.email, token);
    } catch (error) {
      await this.prisma.verificationToken.deleteMany({
        where: { userId, token },
      });
      throw error;
    }
    return { message: 'Email verification link sent' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return {
        message:
          'If an account exists for this email, a reset link has been sent.',
      };
    }

    await this.prisma.resetPasswordToken.deleteMany({
      where: { userId: user.id },
    });
    const token = randomBytes(32).toString('hex');
    const resetToken = await this.prisma.resetPasswordToken.create({
      data: {
        email: user.email,
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 1),
      },
    });

    try {
      await this.emailService.sendPasswordResetEmail(user.email, token);
    } catch (error) {
      await this.prisma.resetPasswordToken.deleteMany({
        where: { id: resetToken.id },
      });
      throw error;
    }
    return {
      message:
        'If an account exists for this email, a reset link has been sent.',
    };
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

    await this.prisma.$transaction(async (transaction) => {
      const consumed = await transaction.resetPasswordToken.deleteMany({
        where: {
          token,
          userId: resetToken.userId,
          expiresAt: { gt: new Date() },
        },
      });
      if (consumed.count !== 1) {
        throw new BadRequestException('Reset token has already been used');
      }
      await transaction.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      });
      await transaction.resetPasswordToken.deleteMany({
        where: { userId: resetToken.userId },
      });
      await transaction.refreshToken.updateMany({
        where: { userId: resetToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
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
      roles: user.roles,
      trustScore: user.trustScore,
      isVerified: user.emailVerifiedAt !== null,
      emailVerified: user.emailVerifiedAt !== null,
      phoneVerified: user.phoneVerifiedAt !== null,
      isSuspended: user.isSuspended,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
