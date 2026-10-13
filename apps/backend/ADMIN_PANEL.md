# Rentra Admin Panel

The `/api/admin/*` controller is protected by the JWT and `ADMIN` role guards.
Verification review routes remain under `/api/verification/admin/*` and use
the same role guard. Frontend route protection is supplemental; the backend is
the authorization boundary.

## Available admin data

Admin list endpoints accept `page` (default 1), `limit` (default 20, maximum
100), `search`, `status`, `type`, and ISO-8601 `from` / `to` filters where
applicable. Paginated responses contain `items`, `total`, `page`, `limit`, and
`totalPages`.

- `/api/admin/dashboard/stats` and `/api/admin/dashboard/activity`
- `/api/admin/users` and `/api/admin/users/:id`
- `/api/admin/landlord-profiles`
- `/api/admin/properties` and `/api/admin/listings`
- `/api/admin/bookings`, `/api/admin/rental-requests`, `/api/admin/agreements`
- `/api/admin/payments`, `/api/admin/reviews`, `/api/admin/notifications`
- `/api/admin/audit-events`
- `/api/admin/reports` (existing report workflow)
- `/api/admin/disputes` (existing dispute workflow)
- `/api/verification/admin/submissions` (existing verification workflow)

Hotels and hostels are property records filtered by `type=HOTEL` and
`type=HOSTEL`. Report, dispute, verification, suspension, and listing
moderation decisions are performed through their existing service workflows;
actions require a reason and are audited. Payment records are read-only to
administrators. Admin endpoints do not permit manual payment success/refund,
booking completion, agreement lifecycle changes, or arbitrary trust-score
updates. Reviews and notifications are read-only because the existing models
do not define an audited hide/review or broadcast workflow.

Admin lists intentionally omit credentials, identity document numbers,
payment idempotency keys, and provider secrets. Dashboard payment amounts are
gross transaction volume grouped by currency, not platform revenue.

## First administrator provisioning

The development seed no longer creates an administrator with a known default
password. It still creates test tenant/landlord fixtures when the database is
empty, so use that seed only in development, never in production. The first
administrator must be an existing account with a verified email address. Use
a controlled environment with the intended production database connection and
run the one-time bootstrap:

```powershell
$env:ADMIN_EMAIL = "verified-operator@example.com"
$env:ADMIN_BOOTSTRAP_REASON = "Initial production administrator provisioning"
$env:ADMIN_BOOTSTRAP_CONFIRMATION = "I_UNDERSTAND_THIS_GRANTS_ADMIN_ACCESS"
pnpm --filter @rentra/backend admin:bootstrap
```

The script refuses to run without all three values, refuses if any admin
already exists, verifies the target account's email, and writes an
`ADMIN_ROLE_GRANTED` moderation audit event in the same serializable
transaction. Do not put real credentials or environment values in source
control or logs. This one-time tool does not grant subsequent admin roles.
