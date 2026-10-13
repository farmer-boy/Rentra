import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ForbiddenException } from '@nestjs/common';
import { AgreementStatus, DisputeType } from '@prisma/client';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { AuditService } from '../src/modules/audit/audit.service';
import { CreateDisputeDto } from '../src/modules/disputes/dto/create-dispute.dto';
import { DisputesService } from '../src/modules/disputes/disputes.service';

const tenantId = 'tenant-1';

function makeService(prisma: Record<string, any>, auditOverrides = {}) {
  const audit = {
    record: async () => ({}),
    listForEntity: async () => [],
    ...auditOverrides,
  };
  return new DisputesService(
    prisma as unknown as PrismaService,
    audit as unknown as AuditService,
  );
}

function createDto(): CreateDisputeDto {
  return {
    type: DisputeType.AGREEMENT,
    agreementId: 'agreement-1',
    reason: 'Repair issue',
    description: 'The agreed repair was not completed.',
  };
}

test('creates an agreement dispute for a verified participant and records audit history', async () => {
  let saved: Record<string, unknown> | undefined;
  let auditCreated = false;
  const transaction = {
    $queryRaw: async () => [],
    dispute: {
      count: async () => 0,
      findFirst: async () => null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        saved = data;
        return { id: 'dispute-1', ...data };
      },
    },
  };
  const prisma = {
    agreement: {
      findUnique: async () => ({
        id: 'agreement-1',
        tenantId,
        landlordId: 'landlord-1',
        listingId: 'listing-1',
        propertyId: 'property-1',
        status: AgreementStatus.ACTIVE,
      }),
    },
    $transaction: async (callback: (tx: typeof transaction) => Promise<unknown>) =>
      callback(transaction),
  };
  const service = makeService(prisma, {
    record: async () => {
      auditCreated = true;
    },
  });

  await service.create(tenantId, createDto());

  assert.equal(saved?.createdById, tenantId);
  assert.equal(saved?.agreementId, 'agreement-1');
  assert.equal(saved?.title, 'Repair issue');
  assert.equal(auditCreated, true);
});

test('rejects a dispute when the requester is not a rental participant', async () => {
  let createCalled = false;
  const prisma = {
    agreement: {
      findUnique: async () => ({
        id: 'agreement-1',
        tenantId: 'another-tenant',
        landlordId: 'landlord-1',
        listingId: 'listing-1',
        propertyId: 'property-1',
        status: AgreementStatus.ACTIVE,
      }),
    },
    $transaction: async () => {
      createCalled = true;
    },
  };

  await assert.rejects(
    makeService(prisma).create(tenantId, createDto()),
    ForbiddenException,
  );
  assert.equal(createCalled, false);
});
