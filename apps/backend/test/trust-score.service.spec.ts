import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BookingStatus,
  PaymentStatus,
  ReportStatus,
  ReportTargetType,
} from '@prisma/client';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { TrustScoreService } from '../src/modules/trust-score/trust-score.service';

function makeService(prisma: Record<string, any>) {
  return new TrustScoreService(prisma as unknown as PrismaService);
}

function makePrisma(overrides: Record<string, any> = {}) {
  return {
    user: {
      findUnique: async () => ({
        id: 'user-1',
        phoneVerifiedAt: new Date(),
        emailVerifiedAt: new Date(),
        verificationSubmissions: [{ kind: 'IDENTITY', status: 'APPROVED' }],
      }),
    },
    booking: {
      findMany: async ({ where }: { where: Record<string, any> }) => {
        if (where.status === BookingStatus.COMPLETED) {
          return Array.from({ length: 6 }, (_, index) => ({
            id: `booking-${index}`,
          }));
        }
        if (where.status === BookingStatus.CANCELLED) {
          return Array.from({ length: 2 }, (_, index) => ({
            id: `cancel-${index}`,
          }));
        }
        return [];
      },
    },
    payment: {
      findMany: async () =>
        Array.from({ length: 8 }, (_, index) => ({ id: `payment-${index}` })),
    },
    review: {
      findMany: async () => Array.from({ length: 3 }, () => ({ rating: 5 })),
    },
    report: {
      findMany: async () =>
        Array.from({ length: 2 }, (_, index) => ({ id: `report-${index}` })),
    },
    $transaction: async (fn: any) =>
      fn({
        user: { update: async () => ({ id: 'user-1' }) },
        trustScore: { create: async () => ({ id: 'score-1' }) },
      }),
    ...overrides,
  };
}

test('returns the default base score when a user has no positive activity', async () => {
  const prisma = makePrisma({
    booking: { findMany: async () => [] },
    payment: { findMany: async () => [] },
    review: { findMany: async () => [] },
    report: { findMany: async () => [] },
    user: {
      findUnique: async () => ({
        id: 'user-1',
        phoneVerifiedAt: null,
        emailVerifiedAt: null,
        verificationSubmissions: [],
      }),
    },
  });

  const service = makeService(prisma);
  const result = await service.calculateForUser('user-1');

  assert.equal(result.finalScore, 50);
  assert.equal(result.breakdown.baseScore, 50);
});

test('adds contributions for phone, email, identity, completed rentals and successful payments', async () => {
  const service = makeService(makePrisma());

  const result = await service.calculateForUser('user-1');

  assert.equal(result.breakdown.phoneVerification, 5);
  assert.equal(result.breakdown.emailVerification, 5);
  assert.equal(result.breakdown.identityVerification, 10);
  assert.equal(result.breakdown.completedRentals, 25);
  assert.equal(result.breakdown.successfulPayments, 15);
});

test('caps the score between 0 and 100', async () => {
  const prisma = makePrisma({
    booking: {
      findMany: async () =>
        Array.from({ length: 100 }, (_, index) => ({ id: `booking-${index}` })),
    },
    payment: {
      findMany: async () =>
        Array.from({ length: 100 }, (_, index) => ({ id: `payment-${index}` })),
    },
    review: {
      findMany: async () => Array.from({ length: 100 }, () => ({ rating: 5 })),
    },
    report: {
      findMany: async () =>
        Array.from({ length: 100 }, (_, index) => ({ id: `report-${index}` })),
    },
  });

  const result = await makeService(prisma).calculateForUser('user-1');

  assert.ok(result.finalScore >= 0 && result.finalScore <= 100);
});

test('persists the recalculated score when requested', async () => {
  let persisted = false;
  const prisma = makePrisma({
    $transaction: async (fn: any) => {
      persisted = true;
      return fn({
        user: { update: async () => ({ id: 'user-1' }) },
        trustScore: { create: async () => ({ id: 'score-1' }) },
      });
    },
  });

  const result = await makeService(prisma).calculateForUser('user-1', true);

  assert.equal(result.userId, 'user-1');
  assert.equal(persisted, true);
});

test('counts only resolved reports with a confirmed violation outcome', async () => {
  let reportFilter: Record<string, unknown> | undefined;
  const prisma = makePrisma({
    report: {
      findMany: async ({ where }: { where: Record<string, unknown> }) => {
        reportFilter = where;
        return [{ id: 'confirmed-report-1' }];
      },
    },
    booking: { findMany: async () => [] },
    payment: { findMany: async () => [] },
    review: { findMany: async () => [] },
  });

  const result = await makeService(prisma).calculateForUser('user-1');

  assert.equal(reportFilter?.violationConfirmed, true);
  assert.equal(result.breakdown.confirmedReportPenalties, 10);
});
