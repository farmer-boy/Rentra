import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import {
  AgreementStatus,
  BookingStatus,
  Prisma,
  ReviewType,
} from '@prisma/client';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { CreateReviewDto } from '../src/modules/reviews/dto/create-review.dto';
import { ReviewsService } from '../src/modules/reviews/reviews.service';

const tenantId = 'tenant-1';
const listingId = 'listing-1';

function makeService(prisma: Record<string, unknown>) {
  return new ReviewsService(prisma as unknown as PrismaService);
}

function makePrisma(overrides: Record<string, unknown> = {}) {
  return {
    listing: {
      findUnique: async () => ({
        id: listingId,
        landlordId: 'landlord-1',
        propertyId: 'property-1',
        property: { ownerId: 'landlord-1' },
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
      findUnique: async () => ({
        id: 'agreement-1',
        tenantId,
        landlordId: 'landlord-1',
        listingId,
        propertyId: 'property-1',
        endDate: new Date('2026-01-01T00:00:00.000Z'),
        status: AgreementStatus.EXPIRED,
      }),
    },
    review: {
      create: async ({ data }: { data: Record<string, unknown> }) => data,
    },
    ...overrides,
  };
}

function createDto(reviewType: ReviewType): CreateReviewDto {
  return {
    reviewType,
    listingId,
    bookingId: 'booking-1',
    rating: 5,
  };
}

test('creates a property review from the authenticated tenant of a completed booking', async () => {
  let created: Record<string, unknown> | undefined;
  const prisma = makePrisma({
    review: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        created = data;
        return data;
      },
    },
  });
  const service = makeService(prisma);

  await service.create(tenantId, createDto(ReviewType.PROPERTY));

  assert.equal(created?.userId, tenantId);
  assert.equal(created?.reviewType, ReviewType.PROPERTY);
  assert.equal(created?.bookingId, 'booking-1');
  assert.equal(created?.landlordId, undefined);
});

test('creates a landlord review from a completed agreement and derives landlord identity', async () => {
  let created: Record<string, unknown> | undefined;
  const prisma = makePrisma({
    review: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        created = data;
        return data;
      },
    },
  });
  const service = makeService(prisma);
  const dto = {
    ...createDto(ReviewType.LANDLORD),
    bookingId: undefined,
    agreementId: 'agreement-1',
  };

  await service.create(tenantId, dto);

  assert.equal(created?.reviewType, ReviewType.LANDLORD);
  assert.equal(created?.landlordId, 'landlord-1');
  assert.equal(created?.agreementId, 'agreement-1');
});

test('rejects a booking that is not completed', async () => {
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
    makeService(prisma).create(tenantId, createDto(ReviewType.PROPERTY)),
    ForbiddenException,
  );
});

test('rejects reviews submitted by someone other than the booking tenant', async () => {
  const prisma = makePrisma({
    booking: {
      findUnique: async () => ({
        id: 'booking-1',
        tenantId: 'another-tenant',
        listingId,
        propertyId: 'property-1',
        status: BookingStatus.COMPLETED,
      }),
    },
  });

  await assert.rejects(
    makeService(prisma).create(tenantId, createDto(ReviewType.PROPERTY)),
    ForbiddenException,
  );
});

test('rejects an agreement until it has a completed lifecycle and ended date', async () => {
  const prisma = makePrisma({
    agreement: {
      findUnique: async () => ({
        id: 'agreement-1',
        tenantId,
        landlordId: 'landlord-1',
        listingId,
        propertyId: 'property-1',
        endDate: new Date('2026-12-01T00:00:00.000Z'),
        status: AgreementStatus.ACTIVE,
      }),
    },
  });
  const dto = {
    ...createDto(ReviewType.PROPERTY),
    bookingId: undefined,
    agreementId: 'agreement-1',
  };

  await assert.rejects(
    makeService(prisma).create(tenantId, dto),
    ForbiddenException,
  );
});

test('maps database uniqueness conflicts to HTTP 409', async () => {
  const duplicate = new Prisma.PrismaClientKnownRequestError(
    'duplicate review',
    { code: 'P2002', clientVersion: 'test' },
  );
  const prisma = makePrisma({
    review: {
      create: async () => {
        throw duplicate;
      },
    },
  });

  await assert.rejects(
    makeService(prisma).create(tenantId, createDto(ReviewType.PROPERTY)),
    ConflictException,
  );
});
