import assert from 'node:assert/strict';
import test from 'node:test';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { VerificationService } from '../src/modules/verification/verification.service';
import { ListingsService } from '../src/modules/listings/listings.service';
import { LocationsService } from '../src/modules/locations/locations.service';

function createService(
  prisma: Record<string, any>,
  trustScore: Record<string, any> = {},
) {
  return new VerificationService(
    prisma as unknown as PrismaService,
    {
      recalculateForUser: async () => undefined,
      ...trustScore,
    } as any,
    { record: async () => undefined } as any,
  );
}

test('phone verification sends a one-time code and never returns it to the client', async () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = {
    JWT_SECRET: process.env.JWT_SECRET,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
  };
  let persistedChallenge: any;
  let sentCode = '';
  let recalculated = false;
  process.env.JWT_SECRET = 'test-verification-secret';
  process.env.TWILIO_ACCOUNT_SID = 'test-account';
  process.env.TWILIO_AUTH_TOKEN = 'test-token';
  process.env.TWILIO_PHONE_NUMBER = '+15551234567';
  globalThis.fetch = async (_input, init) => {
    const form = new URLSearchParams(String(init?.body));
    sentCode = form.get('Body')?.match(/\b(\d{6})\b/)?.[1] ?? '';
    return { ok: true } as Response;
  };

  const service = createService(
    {
      user: {
        findUnique: async () => ({
          id: 'user-1',
          phone: '+15557654321',
          phoneVerifiedAt: null,
        }),
        updateMany: async () => ({ count: 1 }),
      },
      verificationChallenge: {
        count: async () => 0,
        create: async ({ data }: { data: any }) => {
          persistedChallenge = { id: 'challenge-1', ...data, attempts: 0 };
          return persistedChallenge;
        },
        findFirst: async () => persistedChallenge,
        updateMany: async ({ data }: { data: any }) => {
          if (data.attempts?.increment) persistedChallenge.attempts += 1;
          return { count: 1 };
        },
      },
      $transaction: async (callback: (transaction: any) => Promise<unknown>) =>
        callback({
          verificationChallenge: {
            updateMany: async () => ({ count: 1 }),
          },
          user: { updateMany: async () => ({ count: 1 }) },
        }),
    },
    {
      recalculateForUser: async () => {
        recalculated = true;
      },
    },
  );

  try {
    const sent = await service.sendPhoneCode('user-1');
    assert.equal(sent.message, 'Phone verification code sent');
    assert.equal('code' in sent, false);
    assert.match(sentCode, /^\d{6}$/);

    const verified = await service.verifyPhone('user-1', sentCode);
    assert.equal(verified.message, 'Phone number verified successfully');
    assert.equal(recalculated, true);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('property approval is blocked until both identity and host verification are approved', async () => {
  let transactionStarted = false;
  const service = createService({
    user: {
      findUnique: async () => ({
        emailVerifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
      }),
    },
    verificationSubmission: {
      findUnique: async () => ({
        id: 'submission-property',
        userId: 'owner-1',
        propertyId: 'property-1',
        kind: 'PROPERTY',
        status: 'PENDING',
      }),
      findFirst: async ({ where }: { where: { kind: string } }) => ({
        status: where.kind === 'IDENTITY' ? 'APPROVED' : 'REJECTED',
      }),
    },
    $transaction: async () => {
      transactionStarted = true;
    },
  });

  await assert.rejects(
    service.reviewSubmission('admin-1', 'submission-property', {
      decision: 'APPROVED',
      reviewNotes: 'checked',
    }),
    /Identity and host verification must be approved/,
  );
  assert.equal(transactionStarted, false);
});

test('a user cannot submit verification for a property owned by someone else', async () => {
  const service = createService({
    user: {
      findUnique: async () => ({
        emailVerifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
      }),
    },
    property: {
      findUnique: async () => ({
        id: 'property-1',
        ownerId: 'owner-2',
        verificationStatus: 'UNVERIFIED',
      }),
    },
  });

  await assert.rejects(
    service.submitPropertyVerification('user-1', 'property-1', {}),
    /You can only verify your own property/,
  );
});

test('revoking identity verification invalidates approved property badges and refreshes trust score', async () => {
  let trustScoreRefreshed = false;
  let propertyInvalidated = false;
  const service = createService(
    {
      verificationSubmission: {
        findUnique: async () => ({
          id: 'identity-1',
          userId: 'owner-1',
          propertyId: null,
          kind: 'IDENTITY',
          status: 'APPROVED',
        }),
        updateMany: async () => ({ count: 1 }),
      },
      property: {
        findMany: async () => [{ id: 'property-1' }],
        updateMany: async () => {
          propertyInvalidated = true;
          return { count: 1 };
        },
      },
      $transaction: async (callback: (transaction: any) => Promise<unknown>) =>
        callback({
          verificationSubmission: { updateMany: async () => ({ count: 1 }) },
          property: {
            findMany: async () => [{ id: 'property-1' }],
            updateMany: async () => {
              propertyInvalidated = true;
              return { count: 1 };
            },
          },
        }),
    },
    {
      recalculateForUser: async () => {
        trustScoreRefreshed = true;
      },
    },
  );

  await service.revokeSubmission('admin-1', 'identity-1', {
    reviewNotes: 'Verification evidence was invalidated',
  });
  assert.equal(propertyInvalidated, true);
  assert.equal(trustScoreRefreshed, true);
});

test('listing responses derive the Rentra badge only from approved property verification', async () => {
  const listingService = (verificationStatus: string) =>
    new ListingsService(
      {
        listing: {
          findUnique: async () => ({
            id: 'listing-1',
            property: { verificationStatus },
          }),
        },
      } as any,
      {} as LocationsService,
      { record: async () => undefined } as any,
    );

  assert.equal(
    (await listingService('APPROVED').findById('listing-1')).isRentraVerified,
    true,
  );
  assert.equal(
    (await listingService('PENDING').findById('listing-1')).isRentraVerified,
    false,
  );
});
