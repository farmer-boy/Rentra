import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ListingPublicationStatus,
  ListingStatus,
  NotificationType,
  Prisma,
  PropertyStatus,
  TrustSource,
  VerificationKind,
  VerificationStatus,
} from '@prisma/client';
import { createHmac, randomInt } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { TrustScoreService } from '../trust-score/trust-score.service';
import { CreateVerificationSubmissionDto } from './dto/create-verification-submission.dto';
import { CreatePropertyVerificationDto } from './dto/create-property-verification.dto';
import { ReviewVerificationDto } from './dto/review-verification.dto';
import { RevokeVerificationDto } from './dto/revoke-verification.dto';

const PHONE_CODE_TTL_MS = 10 * 60 * 1000;
const PHONE_CODE_ATTEMPT_LIMIT = 5;
const PHONE_CODE_SEND_LIMIT = 3;
const PHONE_CODE_SEND_WINDOW_MS = 15 * 60 * 1000;
const PENDING_PROPERTY_QUEUE_PREFIX = 'property:';

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trustScoreService: TrustScoreService,
    private readonly auditService: AuditService,
  ) {}

  async sendPhoneCode(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, phone: true, phoneVerifiedAt: true },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.phoneVerifiedAt) {
      return { message: 'Phone number is already verified' };
    }
    if (!/^\+[1-9]\d{7,14}$/.test(user.phone)) {
      throw new BadRequestException(
        'Phone number must use international E.164 format before verification',
      );
    }

    const now = new Date();
    const sentRecently = await this.prisma.verificationChallenge.count({
      where: {
        userId,
        kind: 'PHONE',
        createdAt: { gte: new Date(now.getTime() - PHONE_CODE_SEND_WINDOW_MS) },
      },
    });
    if (sentRecently >= PHONE_CODE_SEND_LIMIT) {
      throw new HttpException(
        'Too many phone verification codes requested. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const challenge = await this.prisma.verificationChallenge.create({
      data: {
        userId,
        kind: 'PHONE',
        target: user.phone,
        tokenHash: this.hashPhoneCode(userId, code),
        expiresAt: new Date(now.getTime() + PHONE_CODE_TTL_MS),
      },
    });

    try {
      await this.deliverPhoneCode(user.phone, code);
    } catch (error) {
      await this.prisma.verificationChallenge.delete({
        where: { id: challenge.id },
      });
      throw error;
    }

    return { message: 'Phone verification code sent' };
  }

  async verifyPhone(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, phone: true, phoneVerifiedAt: true },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.phoneVerifiedAt) {
      return { message: 'Phone number is already verified' };
    }

    const now = new Date();
    const challenge = await this.prisma.verificationChallenge.findFirst({
      where: {
        userId,
        kind: 'PHONE',
        target: user.phone,
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!challenge || challenge.expiresAt <= now) {
      throw new BadRequestException(
        'Phone verification code is invalid or expired',
      );
    }
    if (challenge.attempts >= PHONE_CODE_ATTEMPT_LIMIT) {
      throw new HttpException(
        'Too many incorrect codes. Request a new verification code.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const attempt = await this.prisma.verificationChallenge.updateMany({
      where: {
        id: challenge.id,
        consumedAt: null,
        attempts: { lt: PHONE_CODE_ATTEMPT_LIMIT },
        expiresAt: { gt: now },
      },
      data: { attempts: { increment: 1 } },
    });
    if (attempt.count !== 1) {
      throw new BadRequestException(
        'Phone verification code is invalid or expired',
      );
    }
    if (challenge.tokenHash !== this.hashPhoneCode(userId, code)) {
      throw new BadRequestException('Phone verification code is incorrect');
    }

    await this.prisma.$transaction(async (transaction) => {
      const consumed = await transaction.verificationChallenge.updateMany({
        where: { id: challenge.id, consumedAt: null, expiresAt: { gt: now } },
        data: { consumedAt: now },
      });
      if (consumed.count !== 1) {
        throw new ConflictException(
          'Phone verification code has already been used',
        );
      }
      const verified = await transaction.user.updateMany({
        where: { id: userId, phone: user.phone, phoneVerifiedAt: null },
        data: { phoneVerifiedAt: now },
      });
      if (verified.count !== 1) {
        throw new ConflictException(
          'Phone number changed during verification; request a new code',
        );
      }
    });

    await this.trustScoreService.recalculateForUser(
      userId,
      TrustSource.VERIFICATION,
      'Phone verification completed',
    );
    return { message: 'Phone number verified successfully' };
  }

  async submitUserVerification(
    userId: string,
    dto: CreateVerificationSubmissionDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, roles: true },
    });
    if (!user) throw new NotFoundException('User not found');
    await this.assertContactVerified(userId);
    if (dto.kind === 'HOST' && !user.roles.includes('LANDLORD')) {
      throw new ForbiddenException(
        'Only a landlord can submit host verification',
      );
    }
    await this.assertSubmissionAllowed(userId, dto.kind);

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const submission = await transaction.verificationSubmission.create({
          data: {
            userId,
            kind: dto.kind,
            activeKey: `${userId}:${dto.kind}`,
            ...(dto.details && {
              details: dto.details as Prisma.InputJsonValue,
            }),
            evidenceUrls: this.validateEvidenceUrls(dto.evidenceUrls),
          },
          select: {
            id: true,
            kind: true,
            status: true,
            submittedAt: true,
          },
        });
        await this.auditService.record(transaction, {
          actorId: userId,
          actorRole: dto.kind === 'HOST' ? 'LANDLORD' : 'USER',
          entityType: 'USER',
          entityId: userId,
          action: `${dto.kind}_VERIFICATION_SUBMITTED`,
          newStatus: VerificationStatus.PENDING,
        });
        return submission;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A verification submission is already pending',
        );
      }
      throw error;
    }
  }

  async submitPropertyVerification(
    userId: string,
    propertyId: string,
    dto: CreatePropertyVerificationDto,
  ) {
    await this.assertContactVerified(userId);
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, ownerId: true, verificationStatus: true },
    });
    if (!property) throw new NotFoundException('Property not found');
    if (property.ownerId !== userId) {
      throw new ForbiddenException('You can only verify your own property');
    }
    if (property.verificationStatus === VerificationStatus.APPROVED) {
      throw new ConflictException('Property is already verified');
    }
    const existing = await this.prisma.verificationSubmission.findFirst({
      where: {
        propertyId,
        kind: VerificationKind.PROPERTY,
        status: VerificationStatus.PENDING,
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(
        'A property verification submission is already pending',
      );
    }

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const submission = await transaction.verificationSubmission.create({
          data: {
            userId,
            propertyId,
            kind: VerificationKind.PROPERTY,
            activeKey: `${propertyId}:PROPERTY`,
            ...(dto.details && {
              details: dto.details as Prisma.InputJsonValue,
            }),
            evidenceUrls: this.validateEvidenceUrls(dto.evidenceUrls),
          },
          select: { id: true, kind: true, status: true, submittedAt: true },
        });
        await transaction.property.update({
          where: { id: propertyId },
          data: { verificationStatus: VerificationStatus.PENDING },
        });
        await this.auditService.record(transaction, {
          actorId: userId,
          actorRole: 'LANDLORD',
          entityType: 'PROPERTY',
          entityId: propertyId,
          action: 'PROPERTY_VERIFICATION_SUBMITTED',
          newStatus: VerificationStatus.PENDING,
        });
        return submission;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A property verification submission is already pending',
        );
      }
      throw error;
    }
  }

  async getMySubmissions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const [submissions, properties] = await Promise.all([
      this.prisma.verificationSubmission.findMany({
        where: { userId },
        orderBy: { submittedAt: 'desc' },
        select: {
          id: true,
          kind: true,
          status: true,
          propertyId: true,
          reviewNotes: true,
          submittedAt: true,
          reviewedAt: true,
        },
      }),
      this.prisma.property.findMany({
        where: { ownerId: userId },
        select: { id: true, title: true, verificationStatus: true },
      }),
    ]);
    return { submissions, properties };
  }

  async listPendingSubmissions() {
    const [submissions, pendingProperties] = await Promise.all([
      this.prisma.verificationSubmission.findMany({
        where: { status: VerificationStatus.PENDING },
        orderBy: { submittedAt: 'asc' },
        select: {
          id: true,
          kind: true,
          status: true,
          submittedAt: true,
          user: { select: { id: true, fullName: true } },
          property: { select: { id: true, title: true } },
        },
      }),
      this.prisma.property.findMany({
        where: {
          status: PropertyStatus.PENDING_VERIFICATION,
          verificationStatus: { in: [VerificationStatus.UNVERIFIED, VerificationStatus.PENDING] },
          verificationSubmissions: {
            none: { kind: VerificationKind.PROPERTY, status: VerificationStatus.PENDING },
          },
        },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          title: true,
          createdAt: true,
          owner: { select: { id: true, fullName: true } },
        },
      }),
    ]);

    return [
      ...submissions,
      ...pendingProperties.map((property) => ({
        id: `${PENDING_PROPERTY_QUEUE_PREFIX}${property.id}`,
        kind: VerificationKind.PROPERTY,
        status: VerificationStatus.PENDING,
        submittedAt: property.createdAt,
        user: property.owner,
        property: { id: property.id, title: property.title },
      })),
    ].sort((first, second) => first.submittedAt.getTime() - second.submittedAt.getTime());
  }

  async getSubmissionForAdmin(id: string) {
    if (id.startsWith(PENDING_PROPERTY_QUEUE_PREFIX)) {
      const propertyId = id.slice(PENDING_PROPERTY_QUEUE_PREFIX.length);
      const property = await this.prisma.property.findUnique({
        where: { id: propertyId },
        include: {
          owner: { select: { id: true, fullName: true, email: true, phone: true, emailVerifiedAt: true, phoneVerifiedAt: true } },
          images: { select: { url: true }, orderBy: { sortOrder: 'asc' } },
        },
      });
      if (!property || property.status !== PropertyStatus.PENDING_VERIFICATION || property.verificationStatus === VerificationStatus.REJECTED) {
        throw new NotFoundException('Pending property verification was not found');
      }
      return {
        id,
        kind: VerificationKind.PROPERTY,
        status: VerificationStatus.PENDING,
        submittedAt: property.createdAt,
        user: property.owner,
        property: { id: property.id, title: property.title, address: property.address },
        details: {
          description: property.description,
          propertyType: property.propertyType,
          rentalMode: property.rentalMode,
          price: property.price,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          area: property.area,
          city: property.city,
          address: property.address,
        },
        evidenceUrls: property.images.map((image) => image.url),
      };
    }

    const submission = await this.prisma.verificationSubmission.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            emailVerifiedAt: true,
            phoneVerifiedAt: true,
          },
        },
        property: { select: { id: true, title: true, address: true } },
      },
    });
    if (!submission)
      throw new NotFoundException('Verification submission not found');
    return submission;
  }

  async reviewSubmission(
    adminId: string,
    submissionId: string,
    dto: ReviewVerificationDto,
  ) {
    if (submissionId.startsWith(PENDING_PROPERTY_QUEUE_PREFIX)) {
      return this.reviewPendingProperty(
        adminId,
        submissionId.slice(PENDING_PROPERTY_QUEUE_PREFIX.length),
        submissionId,
        dto,
      );
    }

    const submission = await this.prisma.verificationSubmission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        userId: true,
        propertyId: true,
        kind: true,
        status: true,
      },
    });
    if (!submission)
      throw new NotFoundException('Verification submission not found');
    if (submission.status !== VerificationStatus.PENDING) {
      throw new ConflictException(
        'Verification submission has already been reviewed',
      );
    }

    if (
      submission.kind === VerificationKind.PROPERTY &&
      dto.decision === VerificationStatus.APPROVED
    ) {
      await this.assertHostAndIdentityApproved(submission.userId);
    }

    const nextStatus = dto.decision as VerificationStatus;
    await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.verificationSubmission.updateMany({
        where: {
          id: submission.id,
          status: VerificationStatus.PENDING,
        },
        data: {
          status: nextStatus,
          activeKey: null,
          reviewerId: adminId,
          reviewNotes: dto.reviewNotes.trim(),
          reviewedAt: new Date(),
        },
      });
      if (updated.count !== 1) {
        throw new ConflictException(
          'Verification submission has already been reviewed',
        );
      }

      if (
        submission.kind === VerificationKind.PROPERTY &&
        submission.propertyId
      ) {
        await transaction.property.update({
          where: { id: submission.propertyId },
          data: {
            verificationStatus: nextStatus,
            status: nextStatus === VerificationStatus.APPROVED
              ? PropertyStatus.ACTIVE
              : PropertyStatus.REJECTED,
          },
        });
        await transaction.listing.updateMany({
          where: { propertyId: submission.propertyId },
          data: nextStatus === VerificationStatus.APPROVED
            ? { status: ListingStatus.PUBLISHED, publicationStatus: ListingPublicationStatus.PUBLISHED }
            : { status: ListingStatus.REMOVED, publicationStatus: ListingPublicationStatus.UNPUBLISHED },
        });
        await this.auditService.record(transaction, {
          actorId: adminId,
          actorRole: 'ADMIN',
          entityType: 'PROPERTY',
          entityId: submission.propertyId,
          action: `PROPERTY_VERIFICATION_${nextStatus}`,
          previousStatus: VerificationStatus.PENDING,
          newStatus: nextStatus,
          reason: dto.reviewNotes.trim(),
        });
      } else {
        await this.auditService.record(transaction, {
          actorId: adminId,
          actorRole: 'ADMIN',
          entityType: 'USER',
          entityId: submission.userId,
          action: `${submission.kind}_VERIFICATION_${nextStatus}`,
          previousStatus: VerificationStatus.PENDING,
          newStatus: nextStatus,
          reason: dto.reviewNotes.trim(),
        });
        if (nextStatus === VerificationStatus.REJECTED) {
          await transaction.property.updateMany({
            where: {
              ownerId: submission.userId,
              verificationStatus: VerificationStatus.APPROVED,
            },
            data: { verificationStatus: VerificationStatus.UNVERIFIED },
          });
        }
      }

      await transaction.notification.create({
        data: {
          userId: submission.userId,
          type: NotificationType.VERIFICATION,
          title: `${submission.kind === VerificationKind.PROPERTY ? 'Property' : submission.kind === VerificationKind.HOST ? 'Landlord' : 'Identity'} verification ${nextStatus.toLowerCase()}`,
          message: dto.reviewNotes.trim(),
          data: {
            submissionId: submission.id,
            propertyId: submission.propertyId,
            kind: submission.kind,
            href: submission.kind === VerificationKind.PROPERTY
              ? '/dashboard/properties'
              : submission.kind === VerificationKind.HOST
                ? '/dashboard/host-verification'
                : '/dashboard/profile',
          },
        },
      });
    });

    if (submission.kind === VerificationKind.IDENTITY) {
      await this.trustScoreService.recalculateForUser(
        submission.userId,
        TrustSource.VERIFICATION,
        `Identity verification ${nextStatus.toLowerCase()}`,
      );
    }
    return this.getSubmissionForAdmin(submission.id);
  }

  async revokeSubmission(
    adminId: string,
    submissionId: string,
    dto: RevokeVerificationDto,
  ) {
    const submission = await this.prisma.verificationSubmission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        userId: true,
        propertyId: true,
        kind: true,
        status: true,
      },
    });
    if (!submission)
      throw new NotFoundException('Verification submission not found');
    if (submission.status !== VerificationStatus.APPROVED) {
      throw new ConflictException(
        'Only an approved verification can be revoked',
      );
    }

    await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.verificationSubmission.updateMany({
        where: {
          id: submission.id,
          status: VerificationStatus.APPROVED,
        },
        data: {
          status: VerificationStatus.REJECTED,
          activeKey: null,
          reviewerId: adminId,
          reviewNotes: dto.reviewNotes,
          reviewedAt: new Date(),
        },
      });
      if (updated.count !== 1) {
        throw new ConflictException('Verification was changed concurrently');
      }

      if (
        submission.kind === VerificationKind.PROPERTY &&
        submission.propertyId
      ) {
        await transaction.property.update({
          where: { id: submission.propertyId },
          data: { verificationStatus: VerificationStatus.REJECTED },
        });
        await this.auditService.record(transaction, {
          actorId: adminId,
          actorRole: 'ADMIN',
          entityType: 'PROPERTY',
          entityId: submission.propertyId,
          action: 'PROPERTY_VERIFICATION_REVOKED',
          previousStatus: VerificationStatus.APPROVED,
          newStatus: VerificationStatus.REJECTED,
          reason: dto.reviewNotes,
        });
      } else {
        const approvedProperties = await transaction.property.findMany({
          where: {
            ownerId: submission.userId,
            verificationStatus: VerificationStatus.APPROVED,
          },
          select: { id: true },
        });
        await transaction.property.updateMany({
          where: {
            ownerId: submission.userId,
            verificationStatus: VerificationStatus.APPROVED,
          },
          data: { verificationStatus: VerificationStatus.UNVERIFIED },
        });
        await this.auditService.record(transaction, {
          actorId: adminId,
          actorRole: 'ADMIN',
          entityType: 'USER',
          entityId: submission.userId,
          action: `${submission.kind}_VERIFICATION_REVOKED`,
          previousStatus: VerificationStatus.APPROVED,
          newStatus: VerificationStatus.REJECTED,
          reason: dto.reviewNotes,
        });
        for (const property of approvedProperties) {
          await this.auditService.record(transaction, {
            actorId: adminId,
            actorRole: 'ADMIN',
            entityType: 'PROPERTY',
            entityId: property.id,
            action: 'PROPERTY_VERIFICATION_REVOKED',
            previousStatus: VerificationStatus.APPROVED,
            newStatus: VerificationStatus.UNVERIFIED,
            reason: 'Owner verification was revoked',
          });
        }
      }
    });

    if (submission.kind === VerificationKind.IDENTITY) {
      await this.trustScoreService.recalculateForUser(
        submission.userId,
        TrustSource.VERIFICATION,
        'Identity verification revoked',
      );
    }
    return this.getSubmissionForAdmin(submission.id);
  }

  private async assertSubmissionAllowed(
    userId: string,
    kind: 'IDENTITY' | 'HOST',
  ) {
    const latest = await this.prisma.verificationSubmission.findFirst({
      where: { userId, kind },
      orderBy: { submittedAt: 'desc' },
      select: { status: true },
    });
    if (
      latest?.status === VerificationStatus.PENDING ||
      latest?.status === VerificationStatus.APPROVED
    ) {
      throw new ConflictException(
        latest.status === VerificationStatus.PENDING
          ? 'A verification submission is already pending'
          : 'This verification has already been approved',
      );
    }
  }

  private async assertHostAndIdentityApproved(userId: string) {
    await this.assertContactVerified(userId);
    const [identity, host] = await Promise.all([
      this.prisma.verificationSubmission.findFirst({
        where: { userId, kind: VerificationKind.IDENTITY },
        orderBy: { submittedAt: 'desc' },
        select: { status: true },
      }),
      this.prisma.verificationSubmission.findFirst({
        where: { userId, kind: VerificationKind.HOST },
        orderBy: { submittedAt: 'desc' },
        select: { status: true },
      }),
    ]);
    if (
      identity?.status !== VerificationStatus.APPROVED ||
      host?.status !== VerificationStatus.APPROVED
    ) {
      throw new ForbiddenException(
        'Identity and host verification must be approved before property approval',
      );
    }
  }

  private async assertContactVerified(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerifiedAt: true },
    });
    if (!user) throw new NotFoundException('User not found');
    if (!user.emailVerifiedAt) {
      throw new ForbiddenException(
        'Verify your email before submitting verification evidence',
      );
    }
  }

  private async reviewPendingProperty(
    adminId: string,
    propertyId: string,
    queueId: string,
    dto: ReviewVerificationDto,
  ) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, title: true, ownerId: true, status: true, verificationStatus: true },
    });
    if (
      !property ||
      property.status !== PropertyStatus.PENDING_VERIFICATION ||
      property.verificationStatus === VerificationStatus.REJECTED
    ) {
      throw new NotFoundException('Pending property verification was not found');
    }
    if (dto.decision === VerificationStatus.APPROVED) {
      await this.assertHostAndIdentityApproved(property.ownerId);
    }

    const nextStatus = dto.decision as VerificationStatus;
    await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.property.updateMany({
        where: {
          id: property.id,
          status: PropertyStatus.PENDING_VERIFICATION,
          verificationStatus: property.verificationStatus,
        },
        data: {
          verificationStatus: nextStatus,
          status: nextStatus === VerificationStatus.APPROVED
            ? PropertyStatus.ACTIVE
            : PropertyStatus.REJECTED,
        },
      });
      if (updated.count !== 1) {
        throw new ConflictException('Property changed before the review was saved');
      }
      await transaction.listing.updateMany({
        where: { propertyId: property.id },
        data: nextStatus === VerificationStatus.APPROVED
          ? { status: ListingStatus.PUBLISHED, publicationStatus: ListingPublicationStatus.PUBLISHED }
          : { status: ListingStatus.REMOVED, publicationStatus: ListingPublicationStatus.UNPUBLISHED },
      });
      await this.auditService.record(transaction, {
        actorId: adminId,
        actorRole: 'ADMIN',
        entityType: 'PROPERTY',
        entityId: property.id,
        action: `PROPERTY_VERIFICATION_${nextStatus}`,
        previousStatus: property.verificationStatus,
        newStatus: nextStatus,
        reason: dto.reviewNotes.trim(),
      });
    });
    return { id: queueId, kind: VerificationKind.PROPERTY, status: nextStatus };
  }

  private validateEvidenceUrls(urls?: string[]) {
    const evidenceUrls = urls ?? [];
    if (evidenceUrls.length > 10) {
      throw new BadRequestException(
        'No more than 10 evidence links are allowed',
      );
    }
    return evidenceUrls;
  }

  private hashPhoneCode(userId: string, code: string) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new ServiceUnavailableException(
        'Phone verification is not configured',
      );
    }
    return createHmac('sha256', secret)
      .update(`${userId}:${code}`)
      .digest('hex');
  }

  private async deliverPhoneCode(phone: string, code: string) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;
    if (!accountSid || !authToken || !from) {
      throw new ServiceUnavailableException(
        'Phone verification delivery is not configured',
      );
    }

    const body = new URLSearchParams({
      To: phone,
      From: from,
      Body: `Your Rentra verification code is ${code}. It expires in 10 minutes.`,
    });
    let response: Response;
    try {
      response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body,
          signal: AbortSignal.timeout(10_000),
        },
      );
    } catch {
      throw new ServiceUnavailableException(
        'Could not deliver the phone verification code',
      );
    }
    if (!response.ok) {
      throw new ServiceUnavailableException(
        'Could not deliver the phone verification code',
      );
    }
  }
}
