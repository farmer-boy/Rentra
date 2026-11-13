import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import {
  AgreementStatus,
  BookingStatus,
  Prisma,
  ReviewType,
  TrustSource,
} from '@prisma/client';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { CreateReviewDto } from '../src/modules/reviews/dto/create-review.dto';
import { ReviewsService } from '../src/modules/reviews/reviews.service';

const tenantId = 'tenant-1';
const landlordId = 'landlord-1';
const listingId = 'listing-1';
const agreementId = 'agreement-1';

function makeService(
  prisma: Record<string, unknown>,
  trustScore: {
    recalculateForUser: (
      userId: string,
      source?: TrustSource,
      reason?: string,
    ) => Promise<unknown>;
  } = { recalculateForUser: async () => ({}) },
) {
  return new ReviewsService(
    prisma as unknown as PrismaService,
    trustScore as never,
  );
}

function makePrisma(overrides: Record<string, unknown> = {}) {
  return {
    listing: {
      findUnique: async () => ({
        id: listingId,
        landlordId,
        propertyId: 'property-1',
        property: { ownerId: landlordId },
      }),
    },
    booking: {
      findUnique: async () => ({
        id: 'booking-1',
        tenantId,
        listingId,
        propertyId: 'property-1',
        status: BookingStatus.COMPLETED,
      }),
    },
    agreement: {
      updateMany: async () => ({ count: 0 }),
      findUnique: async () => ({
        id: agreementId,
        tenantId,
        landlordId,
        listingId,
        propertyId: 'property-1',
        endDate: new Date('2026-01-01T00:00:00.000Z'),
        status: AgreementStatus.EXPIRED,
        tenant: { id: tenantId, fullName: 'Tenant' },
        landlord: { id: landlordId, fullName: 'Landlord' },
      }),
    },
    review: {
      create: async ({ data }: { data: Record<string, unknown> }) => data,
      findUnique: async () => null,
    },
    ...overrides,
  };
}

function landlordReviewDto(
  overrides: Partial<CreateReviewDto> = {},
): CreateReviewDto {
  return {
    reviewType: ReviewType.LANDLORD,
    agreementId,
    behaviour: 5,
    communication: 4,
    propertyCondition: 5,
    honesty: 4,
    maintenance: 5,
    responseTime: 5,
    wouldRecommend: true,
    ...overrides,
  };
}

function tenantReviewDto(
  overrides: Partial<CreateReviewDto> = {},
): CreateReviewDto {
  return {
    reviewType: ReviewType.TENANT,
    agreementId,
    behaviour: 5,
    rentPayment: 4,
    propertyCare: 4,
    cleanliness: 5,
    communication: 3,
    agreementCompliance: 5,
    wouldRecommend: false,
    ...overrides,
  };
}

test('tenant can review landlord after completed agreement with a calculated rating', async () => {
  let created: Record<string, unknown> | undefined;
  let trustTarget: string | undefined;
  const service = makeService(
    makePrisma({
      review: {
        create: async ({ data }: { data: Record<string, unknown> }) => {
          created = data;
          return data;
        },
        findUnique: async () => null,
      },
    }),
    {
      recalculateForUser: async (target: string) => {
        trustTarget = target;
        return {};
      },
    },
  );

  await service.create(tenantId, landlordReviewDto());

  assert.equal(created?.userId, tenantId);
  assert.equal(created?.landlordId, landlordId);
  assert.equal(created?.tenantId, undefined);
  assert.equal(created?.agreementId, agreementId);
  assert.equal(created?.reviewType, ReviewType.LANDLORD);
  assert.equal(created?.rating, 4.67);
  assert.equal(created?.wouldRecommend, true);
  assert.equal(trustTarget, landlordId);
});

test('landlord can review tenant after completed agreement and cannot supply the target identity', async () => {
  let created: Record<string, unknown> | undefined;
  let trustTarget: string | undefined;
  const service = makeService(
    makePrisma({
      review: {
        create: async ({ data }: { data: Record<string, unknown> }) => {
          created = data;
          return data;
        },
        findUnique: async () => null,
      },
    }),
    {
      recalculateForUser: async (target: string) => {
        trustTarget = target;
        return {};
      },
    },
  );

  await service.create(landlordId, tenantReviewDto());

  assert.equal(created?.userId, landlordId);
  assert.equal(created?.tenantId, tenantId);
  assert.equal(created?.landlordId, undefined);
  assert.equal(created?.rating, 4.33);
  assert.equal(created?.reviewType, ReviewType.TENANT);
  assert.equal(trustTarget, tenantId);
});

test('rejects reviews for agreements that have not completed', async () => {
  const prisma = makePrisma({
    agreement: {
      updateMany: async () => ({ count: 0 }),
      findUnique: async () => ({
        id: agreementId,
        tenantId,
        landlordId,
        listingId,
        propertyId: 'property-1',
        status: AgreementStatus.ACTIVE,
        endDate: new Date('2026-12-01T00:00:00.000Z'),
      }),
    },
  });

  await assert.rejects(
    makeService(prisma).create(tenantId, landlordReviewDto()),
    ForbiddenException,
  );
});

test('rejects a user who is not authorized for the requested review direction', async () => {
  await assert.rejects(
    makeService(makePrisma()).create(landlordId, landlordReviewDto()),
    ForbiddenException,
  );
  await assert.rejects(
    makeService(makePrisma()).create(tenantId, tenantReviewDto()),
    ForbiddenException,
  );
});

test('prevents a user from reviewing themselves even if an agreement is malformed', async () => {
  const prisma = makePrisma({
    agreement: {
      updateMany: async () => ({ count: 0 }),
      findUnique: async () => ({
        id: agreementId,
        tenantId,
        landlordId: tenantId,
        listingId,
        propertyId: 'property-1',
        status: AgreementStatus.EXPIRED,
        endDate: new Date('2026-01-01T00:00:00.000Z'),
      }),
    },
  });

  await assert.rejects(
    makeService(prisma).create(tenantId, landlordReviewDto()),
    ForbiddenException,
  );
});

test('eligibility is derived from the agreement participant and review direction', async () => {
  const service = makeService(makePrisma());

  const eligibility = await service.getEligibility(agreementId, tenantId);

  assert.equal(eligibility.eligible, true);
  assert.equal(eligibility.reviewType, ReviewType.LANDLORD);
  assert.deepEqual(eligibility.target, {
    id: landlordId,
    fullName: 'Landlord',
  });
});

test('rejects invalid or missing category ratings instead of trusting an overall rating', async () => {
  await assert.rejects(
    makeService(makePrisma()).create(
      tenantId,
      landlordReviewDto({ propertyCondition: 6 }),
    ),
    BadRequestException,
  );
  await assert.rejects(
    makeService(makePrisma()).create(
      tenantId,
      landlordReviewDto({ responseTime: undefined, rating: 5 }),
    ),
    BadRequestException,
  );
});

test('maps duplicate agreement reviews to HTTP 409', async () => {
  const duplicate = new Prisma.PrismaClientKnownRequestError(
    'duplicate review',
    { code: 'P2002', clientVersion: 'test' },
  );
  const prisma = makePrisma({
    review: {
      create: async () => {
        throw duplicate;
      },
      findUnique: async () => null,
    },
  });

  await assert.rejects(
    makeService(prisma).create(tenantId, landlordReviewDto()),
    ConflictException,
  );
});

test('keeps the existing completed-booking property review path', async () => {
  let created: Record<string, unknown> | undefined;
  const service = makeService(
    makePrisma({
      review: {
        create: async ({ data }: { data: Record<string, unknown> }) => {
          created = data;
          return data;
        },
      },
    }),
  );

  await service.create(tenantId, {
    reviewType: ReviewType.PROPERTY,
    listingId,
    bookingId: 'booking-1',
    rating: 5,
  });

  assert.equal(created?.userId, tenantId);
  assert.equal(created?.bookingId, 'booking-1');
  assert.equal(created?.reviewType, ReviewType.PROPERTY);
});

test('rejects property reviews for incomplete bookings', async () => {
  const prisma = makePrisma({
    booking: {
      findUnique: async () => ({
        id: 'booking-1',
        tenantId,
        listingId,
        propertyId: 'property-1',
        status: BookingStatus.CONFIRMED,
      }),
    },
  });

  await assert.rejects(
    makeService(prisma).create(tenantId, {
      reviewType: ReviewType.PROPERTY,
      listingId,
      bookingId: 'booking-1',
      rating: 5,
    }),
    ForbiddenException,
  );
});

test('requires a completed agreement for landlord and tenant reviews', async () => {
  await assert.rejects(
    makeService(makePrisma()).create(tenantId, {
      ...landlordReviewDto(),
      agreementId: undefined,
    }),
    BadRequestException,
  );
});
