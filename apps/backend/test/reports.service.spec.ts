import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ConflictException } from '@nestjs/common';
import { ReportTargetType } from '@prisma/client';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { AuditService } from '../src/modules/audit/audit.service';
import { TrustScoreService } from '../src/modules/trust-score/trust-score.service';
import { CreateReportDto, ReportReason } from '../src/modules/reports/dto/create-report.dto';
import { ReportsService } from '../src/modules/reports/reports.service';

const reporterId = 'reporter-1';

function makeService(prisma: Record<string, any>, overrides: Record<string, any> = {}) {
  const audit = {
    record: async () => ({}),
    listForEntity: async () => [],
  };
  const trustScore = { recalculateForUser: async () => ({}) };
  Object.assign(audit, overrides.audit);
  Object.assign(trustScore, overrides.trustScore);
  return new ReportsService(
    prisma as unknown as PrismaService,
    audit as unknown as AuditService,
    trustScore as unknown as TrustScoreService,
  );
}

function reportDto(
  overrides: Partial<CreateReportDto> = {},
): CreateReportDto {
  return {
    targetType: ReportTargetType.USER,
    targetId: 'reported-user-1',
    reason: ReportReason.SCAM,
    description: 'Suspected scam account',
    ...overrides,
  };
}

test('creates a user report with the authenticated reporter and an audit event', async () => {
  let createdData: Record<string, unknown> | undefined;
  let auditWritten = false;
  const transaction = {
    $queryRaw: async () => [],
    report: {
      count: async () => 0,
      findFirst: async () => null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        createdData = data;
        return { id: 'report-1', ...data };
      },
    },
  };
  const prisma = {
    user: { findUnique: async () => ({ id: 'reported-user-1' }) },
    $transaction: async (callback: (tx: typeof transaction) => Promise<unknown>) =>
      callback(transaction),
  };
  const service = makeService(prisma, {
    audit: {
      record: async () => {
        auditWritten = true;
      },
    },
  });

  await service.create(reporterId, reportDto());

  assert.equal(createdData?.reporterId, reporterId);
  assert.equal(createdData?.targetId, 'reported-user-1');
  assert.equal(createdData?.reason, ReportReason.SCAM);
  assert.equal(auditWritten, true);
});

test('rejects a duplicate active report before inserting a second case', async () => {
  let createCalled = false;
  const transaction = {
    $queryRaw: async () => [],
    report: {
      count: async () => 0,
      findFirst: async () => ({ id: 'existing-report' }),
      create: async () => {
        createCalled = true;
      },
    },
  };
  const prisma = {
    user: { findUnique: async () => ({ id: 'reported-user-1' }) },
    $transaction: async (callback: (tx: typeof transaction) => Promise<unknown>) =>
      callback(transaction),
  };

  await assert.rejects(
    makeService(prisma).create(reporterId, reportDto()),
    ConflictException,
  );
  assert.equal(createCalled, false);
});

test('rejects reporting a missing target', async () => {
  const missingPrisma = {
    user: { findUnique: async () => null },
  };
  await assert.rejects(
    makeService(missingPrisma).create(reporterId, reportDto()),
    /User not found/,
  );
});
