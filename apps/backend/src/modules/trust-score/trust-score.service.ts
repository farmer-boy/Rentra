import { Injectable, NotFoundException } from '@nestjs/common';
import {
  BookingStatus,
  PaymentStatus,
  ReportStatus,
  ReportTargetType,
  TrustSource,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { clampTrustScore, trustScoreConfig } from './trust-score.config';

export type TrustScoreBreakdown = {
  baseScore: number;
  phoneVerification: number;
  emailVerification: number;
  identityVerification: number;
  completedRentals: number;
  successfulPayments: number;
  reviews: number;
  cancellationPenalties: number;
  confirmedReportPenalties: number;
};

export type TrustScoreCalculationResult = {
  userId: string;
  finalScore: number;
  breakdown: TrustScoreBreakdown & { finalScore: number };
  calculatedAt: Date;
};

@Injectable()
export class TrustScoreService {
  constructor(private readonly prisma: PrismaService) {}

  async getScoreForUser(userId: string) {
    const result = await this.calculateForUser(userId);

    return {
      userId: result.userId,
      trustScore: result.finalScore,
      breakdown: {
        baseScore: result.breakdown.baseScore,
        phoneVerification: result.breakdown.phoneVerification,
        emailVerification: result.breakdown.emailVerification,
        identityVerification: result.breakdown.identityVerification,
        completedRentals: result.breakdown.completedRentals,
        successfulPayments: result.breakdown.successfulPayments,
        reviews: result.breakdown.reviews,
        cancellationPenalties: result.breakdown.cancellationPenalties,
        confirmedReportPenalties: result.breakdown.confirmedReportPenalties,
      },
      calculatedAt: result.calculatedAt.toISOString(),
    };
  }

  async recalculateForUser(
    userId: string,
    source: TrustSource = TrustSource.ADMIN,
    reason = 'Recalculated from verified activity records',
  ) {
    const result = await this.calculateForUser(userId, true, source, reason);

    return {
      userId: result.userId,
      trustScore: result.finalScore,
      breakdown: {
        baseScore: result.breakdown.baseScore,
        phoneVerification: result.breakdown.phoneVerification,
        emailVerification: result.breakdown.emailVerification,
        identityVerification: result.breakdown.identityVerification,
        completedRentals: result.breakdown.completedRentals,
        successfulPayments: result.breakdown.successfulPayments,
        reviews: result.breakdown.reviews,
        cancellationPenalties: result.breakdown.cancellationPenalties,
        confirmedReportPenalties: result.breakdown.confirmedReportPenalties,
      },
      calculatedAt: result.calculatedAt.toISOString(),
    };
  }

  async calculateForUser(
    userId: string,
    persist = false,
    source: TrustSource = TrustSource.ADMIN,
    reason = 'Recalculated from verified activity records',
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        verificationSubmissions: {
          select: {
            kind: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [
      completedBookings,
      paymentRecords,
      receivedReviews,
      reportsAgainstUser,
    ] = await Promise.all([
      this.prisma.booking.findMany({
        where: {
          tenantId: userId,
          status: BookingStatus.COMPLETED,
        },
        select: { id: true },
      }),
      this.prisma.payment.findMany({
        where: {
          userId: userId,
          status: {
            in: [PaymentStatus.SUCCESS, PaymentStatus.PAID],
          },
        },
        select: { id: true },
      }),
      this.prisma.review.findMany({
        where: {
          OR: [
            { landlordId: userId },
            { tenantId: userId },
            { property: { ownerId: userId } },
          ],
        },
        select: { id: true, rating: true, agreementId: true, reviewType: true, createdAt: true },
      }),
      this.prisma.report.findMany({
        where: {
          targetType: ReportTargetType.USER,
          targetId: userId,
          status: ReportStatus.RESOLVED,
          violationConfirmed: true,
        },
        select: { id: true },
      }),
    ]);

    const agreementReviews =
      await this.prisma.agreementTerminationReview.findMany({
        where: { targetUserId: userId },
        select: { rating: true },
      });

    const cancelledBookings = await this.prisma.booking.findMany({
      where: {
        tenantId: userId,
        status: BookingStatus.CANCELLED,
        confirmedAt: { not: null },
        cancelledAt: { not: null },
      },
      select: { id: true },
    });

    const phoneVerification = user.phoneVerifiedAt
      ? trustScoreConfig.weights.phoneVerification
      : 0;
    const emailVerification = user.emailVerifiedAt
      ? trustScoreConfig.weights.emailVerification
      : 0;
    const identityVerification = user.verificationSubmissions.some(
      (submission) =>
        submission.kind === 'IDENTITY' && submission.status === 'APPROVED',
    )
      ? trustScoreConfig.weights.identityVerification
      : 0;

    const completedRentals = Math.min(
      completedBookings.length * trustScoreConfig.weights.completedRental,
      trustScoreConfig.caps.completedRentals,
    );
    const successfulPaymentContribution = Math.min(
      paymentRecords.length * trustScoreConfig.weights.successfulPayment,
      trustScoreConfig.caps.successfulPayments,
    );

    const reviewedAgreementIds = [...new Set(receivedReviews.map((review) => review.agreementId).filter((id): id is string => Boolean(id)))];
    const reviewPairs = reviewedAgreementIds.length ? await this.prisma.review.findMany({
      where: { agreementId: { in: reviewedAgreementIds } }, select: { agreementId: true, reviewType: true },
    }) : [];
    const sides = new Map<string, Set<string>>();
    for (const pair of reviewPairs) { if (!pair.agreementId) continue; const set = sides.get(pair.agreementId) ?? new Set<string>(); set.add(pair.reviewType); sides.set(pair.agreementId, set); }
    const personReviews = receivedReviews.filter((review) => !review.agreementId ||
      ((sides.get(review.agreementId)?.has('LANDLORD') && sides.get(review.agreementId)?.has('TENANT')) || Date.now() >= review.createdAt.getTime() + 14 * 86400000));
    const validReviewRatings = [...personReviews, ...agreementReviews]
      .map((review) => review.rating)
      .filter(
        (rating) => typeof rating === 'number' && rating >= 1 && rating <= 5,
      );
    const averageReviewRating =
      validReviewRatings.length > 0
        ? validReviewRatings.reduce((sum, rating) => sum + rating, 0) /
          validReviewRatings.length
        : 0;
    // Three stars are neutral; ratings above/below that point raise/lower trust.
    const reviewContribution = validReviewRatings.length
      ? Math.round(((averageReviewRating - 3) / 2) * trustScoreConfig.caps.reviewContribution)
      : 0;

    const cancellationPenalty = Math.min(
      cancelledBookings.length *
        trustScoreConfig.penalties.userInitiatedCancellation +
        Math.max(0, cancelledBookings.length - 1) *
          trustScoreConfig.penalties.repeatedCancellation,
      trustScoreConfig.caps.cancellationPenalty,
    );

    const confirmedReportPenalty = Math.min(
      reportsAgainstUser.length * trustScoreConfig.penalties.confirmedReport,
      trustScoreConfig.caps.confirmedReportPenalty,
    );

    const baseScore = trustScoreConfig.baseScore;
    const totalPositive =
      phoneVerification +
      emailVerification +
      identityVerification +
      completedRentals +
      successfulPaymentContribution;
    const finalScore = clampTrustScore(
      baseScore + totalPositive + reviewContribution - cancellationPenalty - confirmedReportPenalty,
    );

    const result: TrustScoreCalculationResult = {
      userId: user.id,
      finalScore,
      breakdown: {
        baseScore,
        phoneVerification,
        emailVerification,
        identityVerification,
        completedRentals,
        successfulPayments: successfulPaymentContribution,
        reviews: reviewContribution,
        cancellationPenalties: cancellationPenalty,
        confirmedReportPenalties: confirmedReportPenalty,
        finalScore,
      },
      calculatedAt: new Date(),
    };

    if (persist) {
      await this.prisma.$transaction(async (transaction) => {
        await transaction.user.update({
          where: { id: userId },
          data: { trustScore: finalScore },
        });

        await transaction.trustScore.create({
          data: {
            userId,
            score: finalScore,
            source,
            reason,
          },
        });
      });
    }

    return result;
  }
}
