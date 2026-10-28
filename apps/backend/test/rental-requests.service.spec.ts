import assert from 'node:assert/strict';
import test from 'node:test';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { AcceptRentalRequestDto } from '../src/modules/rental-requests/dto/accept-rental-request.dto';
import { RentalRequestsService } from '../src/modules/rental-requests/rental-requests.service';

function makeService(prisma: Record<string, any>) {
  return new RentalRequestsService(prisma as unknown as PrismaService);
}

test('accepting a pending rental request creates an agreement and notifies both parties transactionally', async () => {
  let agreementData: Record<string, unknown> | undefined;
  let notifications: Array<Record<string, unknown>> | undefined;
  let transitionedToAccepted = false;
  const auditEvents: Array<Record<string, unknown>> = [];
  let transactionCalls = 0;
  const request = {
    id: 'request-1',
    tenantId: 'tenant-1',
    landlordId: 'host-1',
    propertyId: 'property-1',
    moveInDate: new Date('2026-11-01T00:00:00.000Z'),
    durationMonths: 12,
    status: 'PENDING',
    property: { ownerId: 'host-1', price: 45000, securityDeposit: 90000 },
    listing: {
      id: 'listing-1',
      rent: 50000,
      deposit: 100000,
      rules: 'No smoking',
    },
  };
  const transaction = {
    $executeRaw: async () => 1,
    agreement: {
      findFirst: async () => null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        agreementData = data;
        return { id: 'agreement-1', ...data };
      },
    },
    rentalRequest: {
      findMany: async () => [],
      updateMany: async ({ data }: { data: { status: string } }) => {
        if (data.status === 'ACCEPTED') {
          transitionedToAccepted = true;
          return { count: 1 };
        }
        return { count: 0 };
      },
      findUniqueOrThrow: async () => ({ ...request, status: 'ACCEPTED' }),
    },
    notification: {
      createMany: async ({
        data,
      }: {
        data: Array<Record<string, unknown>>;
      }) => {
        notifications = data;
        return { count: data.length };
      },
    },
    moderationAuditEvent: { create: async ({ data }: { data: Record<string, unknown> }) => { auditEvents.push(data); return data; } },
  };
  const service = makeService({
    rentalRequest: {
      findUnique: async () => request,
    },
    $transaction: async (
      callback: (tx: typeof transaction) => Promise<unknown>,
    ) => {
      transactionCalls += 1;
      return callback(transaction);
    },
  });
  const terms = Object.assign(new AcceptRentalRequestDto(), {
    startDate: '2026-11-01',
    endDate: '2027-11-01',
  });

  const result = await service.accept('request-1', 'host-1', terms);

  assert.equal(transactionCalls, 1);
  assert.equal(transitionedToAccepted, true);
  assert.equal(auditEvents[0]?.action, 'RENTAL_REQUEST_ACCEPTED');
  assert.equal(auditEvents[0]?.actorId, 'host-1');
  assert.equal(auditEvents[0]?.previousStatus, 'PENDING');
  assert.equal(auditEvents[0]?.newStatus, 'ACCEPTED');
  assert.deepEqual(agreementData, {
    tenantId: 'tenant-1',
    landlordId: 'host-1',
    listingId: 'listing-1',
    propertyId: 'property-1',
    rentalRequestId: 'request-1',
    monthlyRent: 45000,
    securityDeposit: 90000,
    startDate: new Date('2026-11-01T00:00:00.000Z'),
    endDate: new Date('2027-11-01T00:00:00.000Z'),
    paymentDueDay: 1,
    rules: 'No smoking',
    status: 'ACTIVE',
  });
  assert.deepEqual(
    notifications?.map((notification) => notification.userId),
    ['tenant-1', 'host-1'],
  );
  assert.equal(
    (result as { agreement: { id: string } }).agreement.id,
    'agreement-1',
  );
});

test('only the current property owner can review a tenant profile and sensitive identity fields are excluded', async () => {
  const service = makeService({
    rentalRequest: { findFirst: async () => ({
      id: 'request-1', tenantId: 'tenant-1', status: 'PENDING', createdAt: new Date(),
      moveInDate: null, durationMonths: 12, occupants: 2, message: 'Moving for work',
      property: { ownerId: 'host-1', id: 'property-1', title: 'Flat', city: 'Lahore', area: 'Gulberg', price: 50000, images: [] },
    }) },
    user: { findUnique: async () => ({
      id: 'tenant-1', fullName: 'Tenant One', email: 'tenant@example.test',
      emailVerifiedAt: new Date(), phoneVerifiedAt: null, createdAt: new Date(), trustScore: 72,
      cnic: '3520212345671', password: 'must-not-leak', profile: { bio: 'Student', city: 'Lahore' },
      verificationSubmissions: [{ kind: 'IDENTITY', status: 'PENDING', details: { cnic: '3520212345671' }, evidenceUrls: ['private-url'], submittedAt: new Date(), reviewedAt: null }],
    }) },
    agreement: { count: async () => 2, findMany: async () => [] },
    booking: { count: async () => 1, findMany: async () => [] },
    review: { aggregate: async () => ({ _count: { _all: 2 }, _avg: { rating: 4.5 } }) },
  });

  const result = await service.getTenantReviewProfile('request-1', 'host-1');
  const serialized = JSON.stringify(result);
  assert.equal(result.tenant.identityVerification.status, 'PENDING');
  assert.equal(result.tenant.phoneVerified, false);
  assert.equal(result.tenant.completedRentals, 3);
  assert.equal(result.request.property?.title, 'Flat');
  assert.equal(serialized.includes('cnic'), false);
  assert.equal(serialized.includes('password'), false);
  assert.equal(serialized.includes('private-url'), false);
});

test('an unrelated landlord and a tenant cannot retrieve another tenant review profile', async () => {
  const service = makeService({ rentalRequest: { findFirst: async () => null } });
  await assert.rejects(service.getTenantReviewProfile('request-1', 'other-user'), NotFoundException);
  await assert.rejects(service.getTenantReviewProfile('request-1', 'tenant-1'), NotFoundException);
});

test('rejecting a pending request records reason, transition audit, and tenant notification', async () => {
  let notification: Record<string, unknown> | undefined;
  let auditEvent: Record<string, unknown> | undefined;
  const request = { id: 'request-1', tenantId: 'tenant-1', landlordId: 'host-1', propertyId: 'property-1', status: 'PENDING' };
  const tx = {
    rentalRequest: {
      updateMany: async () => ({ count: 1 }),
      findUniqueOrThrow: async () => ({ ...request, status: 'REJECTED' }),
    },
    notification: { create: async ({ data }: { data: Record<string, unknown> }) => { notification = data; return data; } },
    moderationAuditEvent: { create: async ({ data }: { data: Record<string, unknown> }) => { auditEvent = data; return data; } },
  };
  const service = makeService({
    rentalRequest: { findFirst: async () => request },
    property: { findUnique: async () => ({ ownerId: 'host-1' }) },
    $transaction: async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx),
  });
  const result = await service.reject('request-1', 'host-1', 'Move-in date does not fit');
  assert.equal((result as { status: string }).status, 'REJECTED');
  assert.match(String(notification?.message), /Move-in date does not fit/);
  assert.equal(auditEvent?.actorId, 'host-1');
  assert.equal(auditEvent?.reason, 'Move-in date does not fit');
  assert.equal(auditEvent?.newStatus, 'REJECTED');
});

test('a request decision is rejected if another action already changed its status', async () => {
  const tx = {
    rentalRequest: { updateMany: async () => ({ count: 0 }) },
    notification: { create: async () => { throw new Error('must not notify'); } },
    moderationAuditEvent: { create: async () => { throw new Error('must not audit'); } },
  };
  const service = makeService({
    rentalRequest: { findFirst: async () => ({ id: 'request-1', tenantId: 'tenant-1', landlordId: 'host-1', propertyId: 'property-1', status: 'PENDING' }) },
    property: { findUnique: async () => ({ ownerId: 'host-1' }) },
    $transaction: async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx),
  });
  await assert.rejects(service.reject('request-1', 'host-1'), /Only pending requests can be rejected/);
});

test('requesting more information notifies tenant and logs the pending-to-pending action', async () => {
  let notification: Record<string, unknown> | undefined;
  let auditEvent: Record<string, unknown> | undefined;
  const tx = {
    $executeRaw: async () => 1,
    notification: { create: async ({ data }: { data: Record<string, unknown> }) => { notification = data; return data; } },
    moderationAuditEvent: {
      count: async () => 0,
      create: async ({ data }: { data: Record<string, unknown> }) => { auditEvent = data; return data; },
    },
  };
  const service = makeService({
    rentalRequest: { findFirst: async () => ({ id: 'request-1', tenantId: 'tenant-1', landlordId: 'host-1', propertyId: 'property-1', status: 'PENDING' }) },
    property: { findUnique: async () => ({ ownerId: 'host-1' }) },
    $transaction: async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx),
  });
  await service.requestInformation('request-1', 'host-1', 'Please confirm the number of occupants.');
  assert.equal(notification?.userId, 'tenant-1');
  assert.equal(notification?.message, 'Please confirm the number of occupants.');
  assert.equal(auditEvent?.action, 'RENTAL_REQUEST_INFORMATION_REQUESTED');
  assert.equal(auditEvent?.previousStatus, 'PENDING');
  assert.equal(auditEvent?.newStatus, 'PENDING');
});

test('tenant can reply to requested information and the landlord is notified', async () => {
  let notification: Record<string, unknown> | undefined;
  let auditEvent: Record<string, unknown> | undefined;
  const tx = {
    $executeRaw: async () => 1,
    rentalRequest: { findFirst: async () => ({ id: 'request-1', tenantId: 'tenant-1', landlordId: 'host-1', status: 'PENDING' }) },
    moderationAuditEvent: {
      count: async () => 1,
      create: async ({ data }: { data: Record<string, unknown> }) => { auditEvent = data; return data; },
    },
    notification: { create: async ({ data }: { data: Record<string, unknown> }) => { notification = data; return data; } },
  };
  const service = makeService({
    $transaction: async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx),
  });

  await service.respondToInformation('request-1', 'tenant-1', 'There will be two occupants.');

  assert.equal(notification?.userId, 'host-1');
  assert.equal(notification?.message, 'There will be two occupants.');
  assert.equal(auditEvent?.actorRole, 'TENANT');
  assert.equal(auditEvent?.action, 'RENTAL_REQUEST_INFORMATION_RESPONDED');
});

test('another host cannot accept a rental request and no transaction is started', async () => {
  let transactionCalls = 0;
  const service = makeService({
    rentalRequest: {
      findUnique: async () => ({
        id: 'request-1',
        landlordId: 'owner-1',
        status: 'PENDING',
      }),
    },
    $transaction: async () => {
      transactionCalls += 1;
    },
  });

  await assert.rejects(
    service.accept('request-1', 'different-host', new AcceptRentalRequestDto()),
    ForbiddenException,
  );
  assert.equal(transactionCalls, 0);
});

test('an accepted rental request cannot be accepted again', async () => {
  let transactionCalls = 0;
  const service = makeService({
    rentalRequest: {
      findUnique: async () => ({
        id: 'request-1',
        landlordId: 'host-1',
        status: 'ACCEPTED',
        property: { ownerId: 'host-1', price: 45000 },
        listing: { id: 'listing-1', rent: 45000 },
      }),
    },
    $transaction: async () => {
      transactionCalls += 1;
    },
  });

  await assert.rejects(
    service.accept('request-1', 'host-1', new AcceptRentalRequestDto()),
    /Only pending requests can be accepted/,
  );
  assert.equal(transactionCalls, 0);
});
