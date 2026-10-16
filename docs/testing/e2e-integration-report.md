# Rentra End-to-End Integration Test Report

**Execution date:** 2026-10-14  
**Overall status:** BLOCKED — the repository does not currently have an isolated test database or a configured frontend/browser test runner.

## Environment and safety

- Backend tests use Node's built-in test runner with service-level Prisma doubles.
- `apps/backend/package.json` defines no database-backed integration-test command. `@types/supertest` is present, but `supertest` is not a runtime or development dependency.
- No Playwright or Vitest configuration, frontend test script, or frontend test framework was found.
- The root and backend `.env` files define a `DATABASE_URL`, but a credential-safe metadata check found that neither database name is identifiable as test-only and neither configuration sets `NODE_ENV=test`.
- No connection, migration, seed, reset, or destructive database operation was attempted. The configured database is not treated as a test database.
- External email, SMS, payment, and storage providers were not contacted.
- The previous instruction to leave payment functionality alone remains in effect. Payment was neither modified nor exercised as an end-to-end flow.

## Scenario results

`BLOCKED` means the complete requested scenario was not executed through the real API, PostgreSQL, and frontend. Passing service-unit checks below are evidence for individual business rules only and are not reported as end-to-end passes.

| Scenario | API | Database | Auth / Permissions | Notifications | Frontend | Result |
|---|---|---|---|---|---|---|
| 1. Registration / Login | NOT RUN against HTTP endpoints | BLOCKED: no isolated test DB | NOT RUN end-to-end | NOT RUN | NOT RUN | **BLOCKED** |
| 2. Property Approval | Service-level verification rules tested; HTTP flow NOT RUN | BLOCKED | Service-level ownership/approval rules tested; guards NOT RUN over HTTP | NOT RUN end-to-end | NOT RUN | **BLOCKED** |
| 3. Search / Filters | NOT RUN | BLOCKED | NOT RUN | N/A | NOT RUN | **BLOCKED** |
| 4. Favorite / Message | NOT RUN | BLOCKED | NOT RUN | NOT RUN | NOT RUN | **BLOCKED** |
| 5. Rental Request / Agreement | Acceptance service unit checks PASS; HTTP flow NOT RUN | Mocked only; PostgreSQL BLOCKED | Wrong-owner and repeated-accept service checks PASS; guards NOT RUN over HTTP | Both intended recipients asserted against a mock | NOT RUN | **BLOCKED** |
| 6. Hotel Booking | NOT RUN | BLOCKED | NOT RUN | NOT RUN | NOT RUN | **BLOCKED** |
| 7. Hostel Bed Inventory | NOT RUN | BLOCKED | NOT RUN | NOT RUN | NOT RUN | **BLOCKED** |
| 8. Payment / Confirmation | NOT RUN; explicitly outside current scope | BLOCKED | NOT RUN | NOT RUN | NOT RUN | **NOT RUN** |
| 9. Review / Trust Score | Existing service-unit checks PASS; HTTP flow NOT RUN | Mocked only; PostgreSQL BLOCKED | Review eligibility unit checks PASS; guards NOT RUN over HTTP | NOT RUN end-to-end | NOT RUN | **BLOCKED** |
| 10. Property Report | Existing service-unit checks PASS; HTTP flow NOT RUN | Mocked only; PostgreSQL BLOCKED | Admin/report service checks PASS; guards NOT RUN over HTTP | NOT RUN end-to-end | NOT RUN | **BLOCKED** |

## Tests executed

### Backend non-payment service tests

Command:

```powershell
pnpm --filter @rentra/backend exec node --require ./test/register-ts.cjs --test test/admin.service.spec.ts test/reviews.service.spec.ts test/trust-score.service.spec.ts test/reports.service.spec.ts test/disputes.service.spec.ts test/verification.service.spec.ts test/rental-requests.service.spec.ts
```

**Exit code:** 0  
**Result:** 28 passed, 0 failed.

The selected existing service tests cover portions of verification, review eligibility, trust-score calculations, reports, disputes, and admin rules. They use mocked Prisma calls; they do not prove PostgreSQL persistence, controller/guard behavior, or browser behavior.

Three rental-request service tests were added. They verify that accepting a pending request:

- creates the agreement and transitions the request within the transaction;
- queues notifications for the tenant and host in the transaction;
- rejects acceptance by a different host before starting a transaction; and
- rejects a repeated acceptance.

These are service-unit tests using test doubles, not API/database integration tests.

### Build, lint, and formatting evidence

| Check | Result |
|---|---|
| Backend build (`pnpm --filter @rentra/backend build`) | PASS, exit code 0 |
| New test TypeScript check (standalone `tsc --noEmit`) | PASS, exit code 0 |
| New test Prettier check | PASS, exit code 0 |
| New test ESLint invocation | BLOCKED by ESLint project-service configuration: test files are excluded from backend `tsconfig.json` |
| Frontend production build (`pnpm --filter web build`) | PASS, exit code 0 in the host-journey verification immediately before this report |
| Frontend lint (`pnpm --filter web lint`) | PASS with 0 errors and 15 existing warnings in that verification |
| `git diff --check` | PASS, exit code 0 |

The backend package's full `test` script includes payment unit tests. It was not rerun here to keep the current work outside the payment scope. A previous run in the preceding host-work verification reported 39 passing backend tests, including those payment unit tests; that was not an end-to-end payment flow.

## Bugs and changes

- No verified runtime/API/database defect was discovered because the real integrated application could not be exercised safely without a dedicated test database.
- Added service-unit coverage for rental request acceptance in `apps/backend/test/rental-requests.service.spec.ts`.
- Registered the new file in the existing backend `test` script.
- No schema, migration, payment, or production database changes were made.

## Remaining prerequisites

1. Provide a dedicated PostgreSQL test database with an unmistakable test-only database name and test credentials, separate from developer and production data.
2. Add or configure backend HTTP integration coverage against that isolated database; run migrations only after the test URL is verified.
3. Provide a frontend test runner and browser automation setup if frontend and browser assertions are required.
4. Seed deterministic test fixtures and implement cleanup limited to test-created records.
5. Execute scenarios 1–7, 9, and 10 through real endpoints/database/frontend. Scenario 8 remains excluded until payment work is authorized and a safe provider-mock test setup is selected.

Until those prerequisites are met, the ten integrated scenarios are not complete.
