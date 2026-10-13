# Payments API

The backend applies the `/api` global prefix to every route shown below.

All payment amounts and payer IDs are resolved by the backend. The API never
accepts a client-supplied amount or status. Providers are registered through
`PaymentProviderAdapter`; no provider adapter is currently configured, so
initiation, verification, callbacks, and refunds fail closed with
`NotImplementedException`. Do not use this module to collect real money until
an adapter has official credentials, signature verification, and integration
tests.

## Booking payment

Create a booking first. It must belong to the authenticated user and have
`PAYMENT_PENDING` or `HELD` status.

```http
POST /payments
Authorization: Bearer <access-token>
Idempotency-Key: booking-<booking-id>
Content-Type: application/json

{
  "bookingId": "<booking-id>",
  "provider": "JAZZCASH"
}
```

The backend uses the booking's stored total and currency. Once the configured
provider verifies success, the payment is marked `SUCCESS` and the booking is
changed to `CONFIRMED` in the same database transaction. A redirect alone can
never confirm a booking.

## Agreement rent payment

```http
POST /payments
Authorization: Bearer <tenant-access-token>
Idempotency-Key: agreement-<agreement-id>-2026-11
Content-Type: application/json

{
  "agreementId": "<agreement-id>",
  "billingMonth": "2026-11",
  "provider": "BANK_TRANSFER"
}
```

The payer, monthly rent, currency, and due date come from the active agreement.
A verified successful record has a receipt at `GET /payments/:id/receipt`.
Failed attempts can be retried with a new idempotency key; pending attempts are
reused, and the database permits at most one successful payment per
booking/month.

## Status and records

- `POST /payments/:id/verify` — server-to-server provider verification.
- `POST /payments/providers/:provider/webhook` — unauthenticated provider
  callback endpoint; only a registered adapter may validate signatures and
  decode the event. The adapter receives the raw request bytes when available so
  providers can verify signatures over the exact payload.
- `GET /payments/my` — payments visible to the current payer or property owner.
- `GET /payments/:id` — payer or landlord only.
- `GET /payments/:id/receipt` — payer or landlord; successful payments only.
- `POST /payments/:id/refund` — payer requests a provider-verified full refund.
- Statuses: `PENDING`, `PROCESSING`, `SUCCESS`, `FAILED`, `REFUNDED`.

Use a test/mock `PaymentProviderAdapter` in automated tests. Never store card
numbers or CVVs. Provider credentials belong only in backend environment
variables after the corresponding adapter is implemented.
