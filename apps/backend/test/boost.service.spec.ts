import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { CreateBoostOrderDto } from '../src/modules/boost/dto/create-boost-order.dto';
import { BoostService } from '../src/modules/boost/boost.service';

const userId = 'landlord-1';

function makeService(
  transaction: Record<string, unknown>,
  prismaOverrides: Record<string, unknown> = {},
) {
  const prisma = {
    $transaction: (callback: (tx: typeof transaction) => unknown) =>
      callback(transaction),
    ...prismaOverrides,
  };
  return new BoostService(prisma as unknown as PrismaService);
}

function createOrderDto(
  items: Array<{ productId: string; quantity: number }> = [
    { productId: 'hot-listing', quantity: 2 },
  ],
) {
  return { items } as CreateBoostOrderDto;
}

test('creates pending orders with prices resolved from the server catalog', async () => {
  let savedOrder: Record<string, unknown> | undefined;
  let createData: Record<string, unknown> | undefined;
  const transaction = {
    $queryRaw: async () => [],
    boostOrder: {
      findFirst: async () => null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        createData = data;
        const nestedItems = data.items as {
          create: Array<Record<string, unknown>>;
        };
        savedOrder = {
          id: 'boost-order-1',
          status: data.status,
          subtotal: data.subtotal,
          total: data.total,
          currency: data.currency,
          items: nestedItems.create.map((item, index) => ({
            id: `boost-item-${index + 1}`,
            ...item,
          })),
        };
        return savedOrder;
      },
    },
  };
  const service = makeService(transaction);
  const order = await service.createOrder(
    userId,
    createOrderDto(),
    'request-1',
  );

  assert.equal(order.status, 'PENDING_PAYMENT');
  assert.equal(order.subtotal, 15600);
  assert.equal(order.total, 15600);
  assert.equal(order.currency, 'PKR');
  assert.deepEqual(order.items, [
    {
      id: 'boost-item-1',
      productId: 'hot-listing',
      productName: 'Hot Listing',
      quantity: 2,
      unitPrice: 7800,
      lineTotal: 15600,
    },
  ]);
  assert.equal(createData?.userId, userId);
  assert.equal(createData?.idempotencyKey, 'request-1');
  assert.equal('idempotencyKey' in order, false);
});

test('returns the existing order for a matching idempotency key', async () => {
  let createCalls = 0;
  const existingOrder = {
    id: 'boost-order-1',
    userId,
    status: 'PENDING_PAYMENT',
    subtotal: 3000,
    total: 3000,
    currency: 'PKR',
    items: [{ productId: 'listing', quantity: 1 }],
  };
  const transaction = {
    $queryRaw: async () => [],
    boostOrder: {
      findFirst: async () => existingOrder,
      create: async () => {
        createCalls += 1;
        return {};
      },
    },
  };
  const service = makeService(transaction);
  const result = await service.createOrder(
    userId,
    createOrderDto([{ productId: 'listing', quantity: 1 }]),
    'same-request',
  );

  assert.equal(result, existingOrder);
  assert.equal(createCalls, 0);
});

test('rejects unknown products, duplicate products, and invalid quantities', async () => {
  const service = makeService({});
  await assert.rejects(
    service.createOrder(
      userId,
      createOrderDto([{ productId: 'unknown', quantity: 1 }]),
    ),
    BadRequestException,
  );
  await assert.rejects(
    service.createOrder(
      userId,
      createOrderDto([
        { productId: 'listing', quantity: 1 },
        { productId: 'listing', quantity: 1 },
      ]),
    ),
    BadRequestException,
  );
  await assert.rejects(
    service.createOrder(
      userId,
      createOrderDto([{ productId: 'listing', quantity: 21 }]),
    ),
    BadRequestException,
  );
  await assert.rejects(
    service.createOrder(userId, createOrderDto([null as never])),
    BadRequestException,
  );
  await assert.rejects(
    service.createOrder(userId, createOrderDto(), ''),
    BadRequestException,
  );
});

test('does not reveal an order owned by another user', async () => {
  const service = makeService(
    {},
    {
      boostOrder: {
        findFirst: async () => null,
      },
    },
  );
  await assert.rejects(
    service.getOrder('another-user', 'private-order'),
    NotFoundException,
  );
});
