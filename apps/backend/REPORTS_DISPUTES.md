# Reports, disputes, and moderation audit

All paths below use the global `/api` prefix. Authenticated endpoints require a
Bearer token; moderation endpoints additionally require an active `ADMIN` role.
The JWT strategy rejects suspended accounts.

## User APIs

Create a report:

```http
POST /api/reports
Authorization: Bearer <token>
Content-Type: application/json

{
  "targetType": "LISTING",
  "targetId": "listing-id",
  "reason": "FAKE_LISTING",
  "description": "The listing photos and address appear to be copied."
}
```

Supported report targets include `PROPERTY`, `LISTING`, `USER`, `REVIEW`,
`BOOKING`, and the existing `MESSAGE` target. Reasons are `FAKE_LISTING`,
`SCAM`, `WRONG_INFORMATION`, `DUPLICATE_LISTING`, `HARASSMENT`,
`PAYMENT_ISSUE`, and `OTHER`. The target record is checked server-side. A user
cannot report their own account, listing/property, review, booking, or message.
An account may create up to 20 reports per hour and may have only one active
report per target; resolved/rejected reports do not prevent a later independent
report.

List submitted reports with `GET /api/reports/my?page=1&limit=20&status=OPEN`.
`GET /api/reports/:id` is available to the reporter and administrators.

Create a dispute:

```http
POST /api/disputes
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "PAYMENT",
  "paymentId": "payment-id",
  "reason": "Rent payment not reflected",
  "description": "The provider confirmed payment but the account still shows pending."
}
```

`BOOKING`, `PAYMENT`, and `AGREEMENT` disputes require the matching record ID.
`RENTAL_ISSUE` requires at least one of `bookingId`, `paymentId`, or
`agreementId`. If multiple references are supplied, they must match the same
rental and the authenticated user must participate in every referenced record.
Only one active dispute per participant and referenced record is allowed; the
service uses PostgreSQL transaction-scoped advisory locks for concurrent
submissions. There is a limit of 10 new disputes per hour.

List created/assigned cases with `GET /api/disputes/my?page=1&limit=20`.
`GET /api/disputes/:id` is available to the creator, associated booking/payment/
agreement participants, and administrators.

## Admin APIs

The admin role is read from the authenticated user's database record; it is not
accepted from request data.

- `GET /api/admin/reports?status=OPEN&targetType=LISTING&page=1&limit=20`
- `GET /api/admin/reports/:id`
- `POST /api/admin/reports/:id/assign` with `{"adminId":"admin-user-id"}`
- `PATCH /api/admin/reports/:id/status` with
  `{"status":"INVESTIGATING"}`
- `POST /api/admin/reports/:id/notes` with `{"note":"..."}` (internal note)
- `POST /api/admin/reports/:id/request-information` with `{"note":"..."}`
- `POST /api/admin/reports/:id/resolve` with
  `{"resolutionNote":"Finding and rationale","violationConfirmed":false}`
- `POST /api/admin/reports/:id/suspend-user` with `{"reason":"..."}`
- `POST /api/admin/reports/:id/remove-listing` with `{"reason":"..."}`
- `POST /api/admin/reports/:id/reinstate-user` with `{"reason":"..."}`
- `POST /api/admin/reports/:id/restore-listing` with `{"reason":"..."}`
- `GET /api/admin/disputes?status=OPEN&type=PAYMENT&page=1&limit=20`
- `GET /api/admin/disputes/:id`
- `POST /api/admin/disputes/:id/assign` with `{"adminId":"admin-user-id"}`
- `PATCH /api/admin/disputes/:id/status` with
  `{"status":"AWAITING_INFORMATION","resolutionNote":"..."}` when final
- `POST /api/admin/disputes/:id/notes` with `{"note":"..."}` (internal note)
- `POST /api/admin/disputes/:id/request-information` with `{"note":"..."}`
- `POST /api/admin/disputes/:id/resolve` with `{"resolution":"..."}`

Reports use the existing `INVESTIGATING` status for review. Disputes retain the
existing `MEDIATION`/`CLOSED` statuses and add `UNDER_REVIEW`,
`AWAITING_INFORMATION`, and `REJECTED`. Resolution/rejection requires a note.
Rejected/closed cases cannot be reopened; a resolved confirmed user finding can
be reopened through the status workflow and its trust score recalculated.

Suspension/removal actions are intentionally available only after the originating
report is resolved with `violationConfirmed: true`. Restoring/reinstating is
audited and reinstating a confirmed user report clears the finding and requests a
trust-score recalculation. Ordinary report submission never changes a trust
score. Only confirmed reports targeting users count in `TrustScoreService`.
Resolving a dispute does not itself assign blame or create a trust penalty.

## Audit history and operations

`ModerationAuditEvent` stores actor ID/role, entity, action, before/after status,
reason, safe metadata, and timestamp. Case creation, assignment, state changes,
notes, resolution/rejection, suspension/reinstatement, and listing
removal/restoration are written in the same transaction as their state changes.
There are no audit mutation APIs. A PostgreSQL trigger rejects `UPDATE`,
`DELETE`, and `TRUNCATE` on the audit table; actor/entity IDs are snapshots and
do not cascade-delete history. User-facing case detail responses omit internal
investigation notes.

The database migration installs the trigger but cannot know the deployment's
database role name. In production, use a non-owner application role, grant it
only `SELECT` and `INSERT` on `ModerationAuditEvent`, and reserve table ownership,
trigger changes, and retention/export controls for a separate database operator.
The table is append-only; any retention policy should export signed/immutable
archives before privileged deletion.

No upload/evidence storage workflow exists in the current backend, so this
implementation does not accept evidence URLs or files. `request-information`
records an admin request in the audit history; delivery/notification to the
participant is not wired to a notification workflow yet.

## Postman checks

1. Sign in as a tenant and copy the access token.
2. Submit a valid report for an existing listing; repeat it while active and
   expect `409 Conflict`. Submit a made-up target ID and expect `404`.
3. Submit a dispute tied to the tenant's agreement/payment; try an unrelated
   agreement and expect `403`.
4. Call `/reports/my`, `/disputes/my`, and an owned `:id`; try another user's
   case and expect `403`.
5. Sign in as a non-admin and call `/admin/reports` and `/admin/disputes`;
   expect `403`. Repeat with an active admin token and expect paginated results.
6. As admin, assign, add an internal note, request information, and resolve a
   case. Confirm audit history appears to admins but internal notes are not
   returned to case participants.
7. Resolve an unsubstantiated user report with
   `violationConfirmed:false`; verify trust score is unchanged. Confirm a valid
   finding and verify the existing trust-score endpoint reflects the configured
   penalty. Reopen/reinstate and verify recalculation removes that penalty.
8. Confirm suspension blocks later requests through the existing JWT strategy;
   confirm listing removal sets it unpublished without deleting the listing or
   its booking/payment history.
