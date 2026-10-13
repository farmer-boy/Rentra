import assert from 'node:assert/strict';
import test from 'node:test';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { AdminService } from '../src/modules/admin/admin.service';
import { AdminListQueryDto } from '../src/modules/admin/dto/admin-list-query.dto';

function createService(prisma: Record<string, any>) {
  return new AdminService(
    prisma as unknown as PrismaService,
    { record: async () => undefined } as any,
  );
}

test('admin user list is paginated and excludes identity document fields', async () => {
  let findArgs: any;
  const service = createService({
    user: {
      findMany: async (args: any) => {
        findArgs = args;
        return [{ id: 'user-1' }];
      },
      count: async () => 21,
    },
  });
  const query = Object.assign(new AdminListQueryDto(), {
    page: 2,
    limit: 10,
    role: 'LANDLORD',
  });

  const result = await service.getAllUsers(query);

  assert.deepEqual(result, {
    items: [{ id: 'user-1' }],
    total: 21,
    page: 2,
    limit: 10,
    totalPages: 3,
  });
  assert.equal(findArgs.skip, 10);
  assert.equal(findArgs.take, 10);
  assert.deepEqual(findArgs.where.roles, { has: 'LANDLORD' });
  assert.equal('cnic' in findArgs.select, false);
  assert.equal('password' in findArgs.select, false);
});

test('admin payment list never selects idempotency or private provider fields', async () => {
  let findArgs: any;
  const service = createService({
    payment: {
      findMany: async (args: any) => {
        findArgs = args;
        return [];
      },
      count: async () => 0,
    },
  });

  await service.getPayments(new AdminListQueryDto());

  assert.equal('idempotencyKey' in findArgs.select, false);
  assert.equal('receiptUrl' in findArgs.select, false);
  assert.equal('refundTransactionId' in findArgs.select, false);
});

test('legacy listing verification endpoint cannot bypass property verification', async () => {
  let listingWasUpdated = false;
  const service = createService({
    listing: {
      findUnique: async () => ({ id: 'listing-1' }),
      update: async () => {
        listingWasUpdated = true;
      },
    },
  });

  await assert.rejects(
    service.verifyListing('listing-1'),
    /cannot approve property verification/,
  );
  assert.equal(listingWasUpdated, false);
});

test('user moderation cannot suspend an administrator account', async () => {
  const service = createService({
    $transaction: async (callback: (transaction: any) => Promise<unknown>) =>
      callback({
        user: {
          findUnique: async () => ({
            id: 'admin-1',
            roles: ['ADMIN'],
            isSuspended: false,
          }),
          update: async () => {
            throw new Error('Admin must not be suspended');
          },
        },
      }),
  });

  await assert.rejects(
    service.suspendUser('admin-1', 'admin-2', 'test reason'),
    /Admin accounts cannot be suspended/,
  );
});
