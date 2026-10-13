import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  BadRequestException,
  ForbiddenException,
  NotImplementedException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AgreementStatus,
  BookingStatus,
  PaymentProviderType,
  PaymentStatus,
  type Payment,
} from '@prisma/client';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { InitiatePaymentDto } from '../src/modules/payments/dto/initiate-payment.dto';
import { PaymentsService } from '../src/modules/payments/payments.service';
import { PaymentProviderAdapter } from '../src/modules/payments/providers/payment-provider.interface';

const userId = 'tenant-1';

function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: 'payment-1',
    bookingId: null,
    rentalRequestId: null,
    agreementId: null,
    userId,
    amount: 5000,
    currency: 'PKR',
    provider: PaymentProviderType.BANK_TRANSFER,
    method: null,
    status: PaymentStatus.PENDING,
    transactionId: null,
    refundTransactionId: null,
    idempotencyKey: null,
    receiptUrl: null,
    paidAt: null,
    billingMonth: null,
    dueAt: null,
    createdAt: new Date('2026-10-01T00:00:00.000Z'),
    updatedAt: new Date('2026-10-01T00:00:00.000Z'),
    ...overrides,
  };
}

function makeService(
  prisma: Record<string, unknown>,
  adapters: PaymentProviderAdapter[] = [],
) {
  return new PaymentsService(prisma as unknown as PrismaService, adapters);
}

function adapter(
  overrides: Partial<PaymentProviderAdapter> = {},
): PaymentProviderAdapter {
  return {
    provider: PaymentProviderType.BANK_TRANSFER,
    initiate: async () => ({ status: PaymentStatus.PENDING }),
    verify: async () => ({
      verified: true,
      status: PaymentStatus.SUCCESS,
      transactionId: 'provider-tx-1',
      paidAt: new Date('2026-10-09T00:00:00.000Z'),
    }),
    verifyWebhook: async () => ({
      verified: true,
      providerEventId: 'event-1',
      paymentId: 'payment-1',
      status: PaymentStatus.SUCCESS,
      transactionId: 'provider-tx-1',
    }),
    ...overrides,
  };
}

test('fails closed when a requested provider has no registered adapter', async () => {
  const service = makeService({});
  await assert.rejects(
    service.initiate(
      userId,
      {
        bookingId: 'booking-1',
        provider: PaymentProviderType.BANK_TRANSFER,
      },
      'request-1',
    ),
    NotImplementedException,
  );
});

test('rejects a payment request without exactly one booking or agreement', async () => {
  const service = makeService({});
  await assert.rejects(
    service.initiate(userId, {
      provider: PaymentProviderType.BANK_TRANSFER,
    } as InitiatePaymentDto),
    /exactly one bookingId or agreementId/,
  );
});

test('booking payment amount is derived from the booking and stays pending', async () => {
  let savedPayment = makePayment();
  let createData: Record<string, unknown> | undefined;
  const transaction = {
    $queryRaw: async () => [],
    booking: {
      findFirst: async () => ({
        id: 'booking-1',
        tenantId: userId,
        totalAmount: 7250,
        currency: 'PKR',
        status: BookingStatus.PAYMENT_PENDING,
        holdExpiresAt: null,
      }),
      updateMany: async () => ({ count: 1 }),
    },
    agreement: {},
    payment: {
      findFirst: async () => null,
      findUnique: async () => null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        createData = data;
        savedPayment = makePayment({
          ...data,
          id: 'payment-1',
        } as Partial<Payment>);
        return savedPayment;
      },
      updateMany: async ({ data }: { data: Partial<Payment> }) => {
        savedPayment = { ...savedPayment, ...data };
        return { count: 1 };
      },
      findUniqueOrThrow: async () => savedPayment,
    },
    paymentWebhookEvent: {
      findUnique: async () => null,
      create: async () => ({}),
    },
  };
  const prisma = {
    $transaction: async <T>(callback: (tx: typeof transaction) => Promise<T>) =>
      callback(transaction),
  };
  const service = makeService(prisma, [adapter()]);

  const result = await service.initiate(
    userId,
    {
      bookingId: 'booking-1',
      provider: PaymentProviderType.BANK_TRANSFER,
      amount: 1,
    } as InitiatePaymentDto & { amount: number },
    'booking-1-attempt',
  );

  assert.equal(createData?.amount, 7250);
  assert.equal(createData?.userId, userId);
  assert.equal(savedPayment.status, PaymentStatus.PENDING);
  assert.equal(result.payment.id, 'payment-1');
});

test('verified success confirms a payment-pending booking transactionally', async () => {
  const initialPayment = makePayment({
    bookingId: 'booking-1',
    transactionId: 'provider-tx-1',
  });
  let currentPayment = initialPayment;
  let bookingConfirmations = 0;
  const transaction = {
    $queryRaw: async () => [],
    payment: {
      findUnique: async () => currentPayment,
      update: async ({ data }: { data: Partial<Payment> }) => {
        currentPayment = { ...currentPayment, ...data };
        return currentPayment;
      },
    },
    booking: {
      updateMany: async () => {
        bookingConfirmations += 1;
        return { count: 1 };
      },
    },
    paymentWebhookEvent: {
      findUnique: async () => null,
      create: async () => ({}),
    },
  };
  const prisma = {
    payment: {
      findUnique: async () => ({
        ...initialPayment,
        user: null,
        agreement: null,
        booking: null,
      }),
    },
    $transaction: async <T>(callback: (tx: typeof transaction) => Promise<T>) =>
      callback(transaction),
  };
  const service = makeService(prisma, [adapter()]);

  const result = await service.verify('payment-1', userId);

  assert.equal(result.status, PaymentStatus.SUCCESS);
  assert.equal(bookingConfirmations, 1);
});

test('rejects a callback when the provider adapter does not verify its signature', async () => {
  const service = makeService({}, [
    adapter({
      verifyWebhook: async () => ({
        verified: false,
        providerEventId: 'bad-event',
        status: PaymentStatus.PENDING,
      }),
    }),
  ]);

  await assert.rejects(
    service.handleWebhook(
      PaymentProviderType.BANK_TRANSFER,
      { status: 'SUCCESS' },
      {},
    ),
    UnauthorizedException,
  );
});

test('monthly payment amount and due date come from the agreement', async () => {
  let savedPayment = makePayment();
  let createData: Record<string, unknown> | undefined;
  const transaction = {
    $queryRaw: async () => [],
    agreement: {
      findFirst: async () => ({
        id: 'agreement-1',
        tenantId: userId,
        monthlyRent: 65000,
        paymentDueDay: 5,
        startDate: new Date('2026-10-01T00:00:00.000Z'),
        endDate: null,
        status: AgreementStatus.ACTIVE,
      }),
    },
    payment: {
      findFirst: async () => null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        createData = data;
        savedPayment = makePayment({
          ...data,
          id: 'payment-2',
        } as Partial<Payment>);
        return savedPayment;
      },
      updateMany: async ({ data }: { data: Partial<Payment> }) => {
        savedPayment = { ...savedPayment, ...data };
        return { count: 1 };
      },
      findUniqueOrThrow: async () => savedPayment,
    },
    booking: {},
    paymentWebhookEvent: {
      findUnique: async () => null,
      create: async () => ({}),
    },
  };
  const prisma = {
    $transaction: async <T>(callback: (tx: typeof transaction) => Promise<T>) =>
      callback(transaction),
  };
  const service = makeService(prisma, [adapter()]);

  await service.initiate(userId, {
    agreementId: 'agreement-1',
    billingMonth: '2026-11',
    provider: PaymentProviderType.BANK_TRANSFER,
  });

  assert.equal(createData?.amount, 65000);
  assert.equal(
    (createData?.dueAt as Date).toISOString(),
    '2026-11-05T00:00:00.000Z',
  );
});

test('repeated idempotency key returns the original payment without another charge', async () => {
  const existing = makePayment({
    bookingId: 'booking-1',
    idempotencyKey: 'attempt-1',
  });
  let initiateCalls = 0;
  const transaction = {
    $queryRaw: async () => [],
    payment: {
      findFirst: async () => existing,
    },
  };
  const prisma = {
    $transaction: async <T>(callback: (tx: typeof transaction) => Promise<T>) =>
      callback(transaction),
  };
  const service = makeService(prisma, [
    adapter({
      initiate: async () => {
        initiateCalls += 1;
        return { status: PaymentStatus.PENDING };
      },
    }),
  ]);

  const result = await service.initiate(
    userId,
    {
      bookingId: 'booking-1',
      provider: PaymentProviderType.BANK_TRANSFER,
    },
    'attempt-1',
  );

  assert.equal(result.alreadyExists, true);
  assert.equal(result.payment.id, existing.id);
  assert.equal(initiateCalls, 0);
});

test('duplicate webhook delivery applies the event only once', async () => {
  let currentPayment = makePayment({
    agreementId: 'agreement-1',
    transactionId: 'provider-tx-1',
  });
  let webhookEventsCreated = 0;
  let paymentUpdates = 0;
  const transaction = {
    $queryRaw: async () => [],
    payment: {
      findUnique: async () => currentPayment,
      update: async ({ data }: { data: Partial<Payment> }) => {
        paymentUpdates += 1;
        currentPayment = { ...currentPayment, ...data };
        return currentPayment;
      },
    },
    paymentWebhookEvent: {
      findUnique: async () => null,
      create: async () => {
        webhookEventsCreated += 1;
        return {};
      },
    },
  };
  const prisma = {
    payment: {
      findFirst: async () => currentPayment,
    },
    $transaction: async <T>(callback: (tx: typeof transaction) => Promise<T>) =>
      callback(transaction),
  };
  const service = makeService(prisma, [adapter()]);
  const payload = { signature: 'provider-signature' };

  await service.handleWebhook(PaymentProviderType.BANK_TRANSFER, payload, {});
  await service.handleWebhook(PaymentProviderType.BANK_TRANSFER, payload, {});

  assert.equal(currentPayment.status, PaymentStatus.SUCCESS);
  assert.equal(webhookEventsCreated, 1);
  assert.equal(paymentUpdates, 1);
});

test('prevents a second successful rent payment for the same billing month', async () => {
  const paidPayment = makePayment({
    agreementId: 'agreement-1',
    billingMonth: new Date('2026-11-01T00:00:00.000Z'),
    status: PaymentStatus.SUCCESS,
  });
  const transaction = {
    $queryRaw: async () => [],
    agreement: {
      findFirst: async () => ({
        id: 'agreement-1',
        tenantId: userId,
        monthlyRent: 65000,
        paymentDueDay: 5,
        startDate: new Date('2026-10-01T00:00:00.000Z'),
        endDate: null,
        status: AgreementStatus.ACTIVE,
      }),
    },
    payment: {
      findFirst: async ({
        where,
      }: {
        where: { status?: { in?: string[] } };
      }) =>
        where.status?.in?.includes(PaymentStatus.SUCCESS) ? paidPayment : null,
      create: async () => {
        throw new Error(
          'A duplicate successful rent payment must not be created',
        );
      },
    },
  };
  const prisma = {
    $transaction: async <T>(callback: (tx: typeof transaction) => Promise<T>) =>
      callback(transaction),
  };
  const service = makeService(prisma, [adapter()]);

  await assert.rejects(
    service.initiate(userId, {
      agreementId: 'agreement-1',
      billingMonth: '2026-11',
      provider: PaymentProviderType.BANK_TRANSFER,
    }),
    BadRequestException,
  );
});

test('does not expose another user payment through the receipt endpoint', async () => {
  const service = makeService({
    payment: {
      findUnique: async () => ({
        ...makePayment({ userId: 'other-tenant' }),
        user: null,
        agreement: { landlordId: null },
        booking: null,
      }),
    },
  });

  await assert.rejects(
    service.getReceipt('payment-1', userId),
    ForbiddenException,
  );
});

test('does not return the internal idempotency key in payment details', async () => {
  const service = makeService({
    payment: {
      findUnique: async () => ({
        ...makePayment({ idempotencyKey: 'internal-retry-token' }),
        user: null,
        agreement: null,
        booking: null,
      }),
    },
  });

  const result = await service.getById('payment-1', userId);

  assert.equal('idempotencyKey' in result, false);
});

test('does not issue a receipt before verified success', async () => {
  const service = makeService({
    payment: {
      findUnique: async () => ({
        ...makePayment(),
        user: null,
        agreement: null,
        booking: null,
      }),
    },
  });

  await assert.rejects(
    service.getReceipt('payment-1', userId),
    BadRequestException,
  );
});

test('rejects a verification result the provider could not verify', async () => {
  const service = makeService(
    {
      payment: {
        findUnique: async () => ({
          ...makePayment(),
          user: null,
          agreement: null,
          booking: null,
        }),
      },
    },
    [
      adapter({
        verify: async () => ({
          verified: false,
          status: PaymentStatus.FAILED,
        }),
      }),
    ],
  );

  await assert.rejects(
    service.verify('payment-1', userId),
    UnauthorizedException,
  );
});

test('does not advertise refund support when the adapter lacks it', async () => {
  const service = makeService(
    {
      payment: {
        findUnique: async () => ({
          ...makePayment({ status: PaymentStatus.SUCCESS }),
          user: null,
          agreement: null,
          booking: null,
        }),
      },
    },
    [adapter()],
  );

  await assert.rejects(
    service.refund('payment-1', userId),
    NotImplementedException,
  );
});
