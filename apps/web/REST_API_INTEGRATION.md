# Web REST API integration

The web app uses one Axios client (`src/api/client.ts`) and feature modules in
`src/api/`. API paths below are relative to the NestJS global `/api` prefix.

## Configuration

Create `apps/web/.env.local` from `.env.example` and set:

```dotenv
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_TIMEOUT_MS=15000
```

`VITE_API_URL` remains a fallback for existing local setups. Do not commit
`.env.local` or credentials.

## Client behavior

- Adds the persisted access token as a bearer token.
- Normalizes HTTP, validation, timeout, and network failures to `ApiError`.
- On an eligible 401, sends one single-flight request to `POST /auth/refresh`,
  rotates the in-memory refresh token, and retries the failed request once.
- Clears the local session and navigates to `/login` if refresh fails.
- Calls `GET /auth/me` during app startup before rendering protected routes.
- Uses `withCredentials` for backend compatibility; the current backend returns
  access and refresh tokens in the response body, not an HttpOnly cookie.

The refresh token intentionally stays in memory. As a result, a full reload
cannot refresh an expired access token; the user will need to sign in again.
Changing this requires a coordinated backend cookie/session contract.

## Feature modules and verified routes

Import from `src/api/` (or its central `src/api/index.ts` export) rather than
creating feature-specific Axios instances.

| API module | Backend routes used |
| --- | --- |
| `auth.ts` | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`; `GET /auth/me` |
| `listings.ts` | `GET /listings`, `/listings/:id`, `/listings/landlord/my-listings`, `/listings/landlord/analytics`; `POST /listings`, `/listings/:id/view`, `/listings/:id/images/upload`; `PATCH /listings/:id`, `/listings/:id/availability`; `DELETE /listings/:id` |
| `properties.ts` | `GET /properties`, `/properties/search`, `/properties/nearby`, `/properties/:id`, `/properties/:id/availability`, `/properties/:id/room-types`; property create/update/stats/view endpoints |
| `favorites.ts` | `GET /favorites`, `/favorites/:listingId`; `POST` and `DELETE /favorites/:listingId` |
| `savedSearches.ts` | `GET`, `POST /saved-searches`; `PATCH`, `DELETE /saved-searches/:id` |
| `rentalRequests.ts` | `POST /properties/:id/rental-requests`; `GET /rental-requests/my`, `/received`; `PATCH /rental-requests/:id/{accept,reject,cancel}` |
| `agreements.ts` | `GET /agreements/my`, `/agreements/:id`; `PATCH /agreements/:id/terminate` |
| `bookings.ts` | `POST /bookings`; `GET /bookings/my`, `/bookings/:id`, `/properties/:id/bookings`; `PATCH /bookings/:id/cancel` |
| `availability.ts` | `GET /properties/:id/availability`; `POST` and `DELETE /properties/:id/availability/block`; listing availability update |
| `payments.ts` | `POST /payments`; `GET /payments`, `/payments/my`, `/payments/tenant/my-payments`, `/payments/agreement/:agreementId`, `/payments/:id`; provider verification, receipt, and refund routes |
| `messages.ts` | Conversations, conversation messages, unread count, message notifications, and mark-read routes under `/messages` |
| `notifications.ts` | `GET /notifications`; `PATCH /notifications/read-all` and `/notifications/:id/read` |
| `reviews.ts` | `GET /reviews`, `/reviews/:id`, `/reviews/listing/:listingId`, `/properties/:id/reviews`, `/users/:id/reviews`; `POST /reviews`; `DELETE /reviews/:id` |
| `users.ts` | `GET`, `PATCH /users/me`; public `GET /users/:id`; landlord-profile and trust-score routes |
| `reports.ts` | User reports and admin report moderation routes |
| `disputes.ts` | `POST /disputes`; `GET /disputes/my`, `/disputes/:id` |
| `recommendations.ts` | `GET /recommendations` |
| `admin.ts` | Admin user/listing/property/dispute moderation, verification, and dashboard routes |
| `locations.ts` | Country/province/city/area lookup, search, and `GET /locations/:id` |

`/listings` and `/properties` are separate backend resources with separate
response shapes. Do not substitute one for the other. The listings create
contract uses `rent`, `deposit`, and `propertyType`; the properties create
contract uses `price`, `securityDeposit`, `type`, and `rentalMode`.

## Workflow constraints from the backend

- Registration accepts `fullName`, `email`, `phone`, and `password`; a role is
  not selected by the registration endpoint.
- An agreement is created by accepting a rental request. There is no standalone
  agreement-create or sign route.
- Payment initiation accepts a booking or agreement plus provider and optional
  billing month. The server resolves payer and amount; never send a trusted
  amount from the browser.
- Booking dates are `checkIn` and `checkOut`; optional inventory identifiers
  select a hotel room, room type, or hostel bed.
- A review requires a completed booking or agreement, a listing, and a review
  type. It cannot be submitted for an arbitrary user/listing pair.
- The service layer deliberately does not expose client methods for routes
  absent from the backend controller contract.

## Error handling

```ts
import { ApiError } from '@/api/api-error';
import { listingsAPI } from '@/api/listings';

try {
  const listing = await listingsAPI.getOne('listing-id');
} catch (error) {
  if (error instanceof ApiError) {
    // `status`, `code`, and validation `fieldErrors` are available when present.
    showError(error.message);
  } else {
    throw error;
  }
}
```

## Local development

From the repository root:

```sh
pnpm --filter web dev
pnpm --filter web build
```

Run the NestJS backend on port `3000` (or update `VITE_API_BASE_URL`). The
frontend dev server defaults to port `5173`.
