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
  rotates the refresh token, and retries the failed request once. The refresh
  token is kept in memory and `sessionStorage`, so it survives reloads in the
  same browser tab but is cleared when that tab's session ends.
- Clears the local session and navigates to `/login` if refresh fails.
- Calls `GET /auth/me` during app startup before rendering protected routes.
- Does not send credentialed cookies. The current backend returns access and
  refresh tokens in response bodies and accepts bearer access tokens; it does
  not issue an HttpOnly refresh cookie.

The backend currently returns refresh tokens in the response body rather than
setting an HttpOnly cookie. Keeping the token in `sessionStorage` allows a
reload in the same tab to refresh, but JavaScript can still access it; an
HttpOnly cookie-based design would require coordinated backend and CSRF work.

## Feature modules and verified routes

Import from `src/api/` (or its central `src/api/index.ts` export) rather than
creating feature-specific Axios instances.

| API module | Backend routes used |
| --- | --- |
| `auth.ts` | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`; `GET /auth/me`, `/auth/verify-email` |
| `listings.ts` | `GET /listings`, `/listings/:id`, `/listings/landlord/my-listings`, `/listings/landlord/analytics`; `POST /listings`, `/listings/:id/view`, `/listings/:id/images/upload`; `PATCH /listings/:id`, `/listings/:id/availability`; `DELETE /listings/:id` |
| `properties.ts` | `GET /properties`, `/properties/search`, `/properties/nearby`, `/properties/:id`, `/properties/:id/availability`, `/properties/:id/room-types`; property create/update/stats/view endpoints |
| `favorites.ts` | Authenticated `GET /favorites`, `/favorites/:listingId`; `POST` and `DELETE /favorites/:listingId` |
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
| `locations.ts` | Country/province/city/area lookup (including `GET /locations/cities`), search, and `GET /locations/:id` |
| `contacts.ts` | `POST /contact/message`; admin-only `GET /contact/messages`, `GET /contact/message/:id`, `PATCH /contact/message/:id/read`, and `DELETE /contact/message/:id` |

`/listings` and `/properties` are separate backend resources with separate
response shapes. Do not substitute one for the other. The listings create
contract uses `rent`, `deposit`, and `propertyType`; the properties create
contract uses `price`, `securityDeposit`, `type`, and `rentalMode`.

## Workflow constraints from the backend

- Guests can browse the published marketplace through `/listings` and
  `/listings/:id`; the `/favorites` page offers sign-in rather than querying
  protected favorite data for guests. Favorite, chat, rental-request, and
  booking actions require authentication. Login and registration return to the
  listing page when started from one of those actions.
- Landlord property submission uses `POST /properties`, which creates the
  Property and its linked marketplace Listing. Rental requests and bookings
  use the linked Property ID; older Listing-only records without `propertyId`
  cannot use those actions and the detail page explains that limitation.
- Listing filters and pagination are sent to `GET /listings` using the query
  names and enum values accepted by `ListingQueryDto`; the URL reflects the
  current search so it can be bookmarked or shared.
- Short-term booking first reads `GET /properties/:id/availability` for the
  chosen dates and selected inventory unit (when applicable), then submits
  `POST /bookings`. Hotel and guest-house listings use available room units;
  hostel listings use beds whose server-provided status is `AVAILABLE`.
  Availability and final pricing are revalidated by the backend when the
  booking is created.
- Registration accepts `fullName`, `email`, `phone`, `password`, and optional
  CNIC. CNIC is validated and stored where supplied; a role is not selected by
  the registration endpoint and new accounts start as tenants.
- Password recovery uses `POST /auth/forgot-password` and
  `POST /auth/reset-password`. Reset emails open the web app at
  `/reset-password?token=...`; configure `FRONTEND_URL` to the public web
  origin so emailed reset links return to the application.
- Verification emails open the web app at `/verify-email?token=...`. The page
  waits for an explicit click before calling `GET /auth/verify-email`, so
  automated email-link scanners do not consume the single-use token.
- An agreement is created by accepting a rental request. There is no standalone
  agreement-create or sign route.
- Payment initiation accepts a booking or agreement plus provider and optional
  billing month. The server resolves payer and amount; never send a trusted
  amount from the browser. The current `PaymentsModule` has no provider
  adapters configured, so the UI shows payment history but cannot start an
  online payment until a backend provider is wired.
- Booking dates are `checkIn` and `checkOut`; optional inventory identifiers
  select a hotel room, room type, or hostel bed.
- Listing maps and detail maps are rendered only when backend coordinates are
  present. Search sorting uses the supported `sortBy` (`createdAt`, `rent`,
  `sqft`, `title`) and `sortOrder` (`asc`, `desc`) values. The home page's city
  shortcuts are loaded from `GET /locations/cities` rather than hardcoded.
- A review requires a completed booking or agreement, a listing, and a review
  type. It cannot be submitted for an arbitrary user/listing pair. The tenant
  review screen offers submission only for completed bookings; the backend
  remains authoritative for eligibility and duplicate prevention.
- Chat and contact-message polling use REST endpoints; no WebSocket transport is
  implemented by these integrations.
- The service layer deliberately does not expose client methods for routes
  absent from the backend controller contract.

## Server state and authorization

TanStack Query is already installed and is configured with a 30-second stale
window and one retry for transient errors. Property search/details, booking
lists, user/listing reviews, notifications, favorites, and admin contact
messages use query caching; successful mutations update or invalidate the
corresponding keys. Form values and display-only state remain local React
state.

NestJS allows requests from local development origins such as
`http://localhost:5173` and other localhost ports. Production frontend origins
must be explicitly allowed by backend CORS configuration. Credentialed browser
requests are not required for the current body-token auth contract.

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
pnpm --filter @rentra/backend start:dev
```

Run the NestJS backend on port `3000` (or update `VITE_API_BASE_URL`). The
frontend dev server defaults to port `5173`.
