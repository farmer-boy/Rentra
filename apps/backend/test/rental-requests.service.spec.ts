import assert from 'node:assert/strict';
import test from 'node:test';
import { ForbiddenException } from '@nestjs/common';
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
  let rejectedOtherRequests = false;
  let transactionCalls = 0;
  const request = {
    id: 'request-1',
    tenantId: 'tenant-1',
    landlordId: 'host-1',
    propertyId: 'property-1',
    moveInDate: new Date('2026-11-01T00:00:00.000Z'),
    durationMonths: 12,
    status: 'PENDING',
    property: { price: 45000, securityDeposit: 90000 },
    listing: {
      id: 'listing-1',
      rent: 50000,
      deposit: 100000,
      rules: 'No smoking',
    },
  };
  const transaction = {
    $queryRaw: async () => [],
    agreement: {
      findFirst: async () => null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        agreementData = data;
        return { id: 'agreement-1', ...data };
      },
    },
    rentalRequest: {
      updateMany: async ({ data }: { data: { status: string } }) => {
        if (data.status === 'ACCEPTED') {
          transitionedToAccepted = true;
          return { count: 1 };
        }
        rejectedOtherRequests = true;
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
  assert.equal(rejectedOtherRequests, true);
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
        property: { price: 45000 },
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
