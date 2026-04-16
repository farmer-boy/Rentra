# REST API Integration Guide

## Overview
The Rentra web application connects to a NestJS backend API running on `http://localhost:3000/api`. This document describes all available API clients and their usage.

## Configuration

### Environment Variables
Create a `.env.local` file in `apps/web/`:
```
VITE_API_URL=http://localhost:3000/api
```

## API Clients

All API clients are located in `src/api/` directory and use a centralized Axios instance configured with:
- Base URL: `http://localhost:3000/api`
- Default headers: `Content-Type: application/json`
- Credentials: Enabled (cookies, sessions)
- Automatic JWT token attachment to all requests
- Token refresh on 401 responses

### 1. Authentication API (`src/api/auth.ts`)

```typescript
import { authAPI } from '@/api/auth';

// Register a new user
await authAPI.register({
  email: 'user@example.com',
  password: 'secure123',
  name: 'John Doe',
  role: 'TENANT' // or 'LANDLORD', 'ADMIN'
});

// Login
const { accessToken, user } = await authAPI.login({
  email: 'user@example.com',
  password: 'secure123'
});

// Get current user
const me = await authAPI.getMe();

// Logout
authAPI.logout();
```

**Endpoints:**
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user info
- `POST /auth/refresh` - Refresh access token

---

### 2. Listings API (`src/api/listings.ts`)

```typescript
import { listingsAPI } from '@/api/listings';

// Get all listings (paginated)
const listings = await listingsAPI.getAll(1, 10);

// Get single listing
const listing = await listingsAPI.getOne('listing-id');

// Create new listing (Landlord)
const newListing = await listingsAPI.create({
  title: 'Beautiful 2BR Apartment',
  description: 'Modern apartment in downtown',
  address: '123 Main St, City, State 12345',
  price: 1500,
  bedrooms: 2,
  bathrooms: 1,
  squareFeet: 950,
  images: ['url1', 'url2'],
  amenities: ['WiFi', 'AC', 'Parking']
});

// Update listing
const updated = await listingsAPI.update('listing-id', {
  price: 1600,
  amenities: ['WiFi', 'AC', 'Parking', 'Gym']
});

// Delete listing
await listingsAPI.delete('listing-id');

// Get my listings (Landlord)
const myListings = await listingsAPI.getMyListings();

// Search listings
const results = await listingsAPI.search('downtown apartment');
```

**Endpoints:**
- `GET /listings` - Get all listings (paginated)
- `GET /listings/:id` - Get single listing
- `POST /listings` - Create listing
- `PATCH /listings/:id` - Update listing
- `DELETE /listings/:id` - Delete listing
- `GET /listings/my` - Get user's listings
- `GET /listings/search` - Search listings

---

### 3. Agreements API (`src/api/agreements.ts`)

```typescript
import { agreementsAPI } from '@/api/agreements';

// Get all agreements (paginated)
const agreements = await agreementsAPI.getAll(1, 10);

// Get single agreement
const agreement = await agreementsAPI.getById('agreement-id');

// Create agreement
const newAgreement = await agreementsAPI.create({
  title: 'Lease Agreement',
  content: '... agreement text ...',
  listingId: 'listing-id',
  tenantId: 'tenant-id'
});

// Sign agreement
const signed = await agreementsAPI.sign('agreement-id');

// Get agreements for a listing
const listingAgreements = await agreementsAPI.getByListing('listing-id');
```

**Endpoints:**
- `GET /agreements` - Get all agreements (paginated)
- `GET /agreements/:id` - Get single agreement
- `POST /agreements` - Create agreement
- `PATCH /agreements/:id` - Update agreement
- `POST /agreements/:id/sign` - Sign agreement

---

### 4. Payments API (`src/api/payments.ts`)

```typescript
import { paymentsAPI } from '@/api/payments';

// Get all payments (paginated)
const payments = await paymentsAPI.getAll(1, 10);

// Get single payment
const payment = await paymentsAPI.getById('payment-id');

// Create payment
const newPayment = await paymentsAPI.create({
  amount: 1500,
  type: 'RENT', // or 'DEPOSIT', 'OTHER'
  agreementId: 'agreement-id',
  dueDate: '2026-05-01'
});

// Get payment history for agreement
const history = await paymentsAPI.getHistory('agreement-id');

// Get my payments
const myPayments = await paymentsAPI.getMyPayments();
```

**Endpoints:**
- `GET /payments` - Get all payments (paginated)
- `GET /payments/:id` - Get single payment
- `POST /payments` - Create payment
- `GET /payments/agreement/:id` - Get agreement payments
- `GET /payments/my` - Get current user's payments

---

### 5. Disputes API (`src/api/disputes.ts`)

```typescript
import { disputesAPI } from '@/api/disputes';

// Get all disputes (paginated)
const disputes = await disputesAPI.getAll(1, 10);

// Get single dispute
const dispute = await disputesAPI.getOne('dispute-id');

// Create dispute
const newDispute = await disputesAPI.create({
  title: 'Property Damage Claim',
  description: 'Walls damaged during occupancy',
  agreementId: 'agreement-id'
});

// Add message to dispute
const updated = await disputesAPI.addMessage(
  'dispute-id',
  'I disagree with this claim.'
);

// Get my disputes
const myDisputes = await disputesAPI.getMyDisputes();

// Resolve dispute
const resolved = await disputesAPI.resolve('dispute-id');
```

**Endpoints:**
- `GET /disputes` - Get all disputes (paginated)
- `GET /disputes/:id` - Get single dispute
- `POST /disputes` - Create dispute
- `PATCH /disputes/:id` - Update dispute
- `POST /disputes/:id/message` - Add message
- `GET /disputes/my` - Get user's disputes
- `POST /disputes/:id/resolve` - Resolve dispute

---

### 6. Reviews API (`src/api/reviews.ts`)

```typescript
import { reviewsAPI } from '@/api/reviews';

// Get all reviews (paginated)
const reviews = await reviewsAPI.getAll(1, 10);

// Get single review
const review = await reviewsAPI.getById('review-id');

// Create review
const newReview = await reviewsAPI.create({
  rating: 5,
  comment: 'Excellent landlord! Highly recommended.',
  targetUserId: 'user-id',
  agreementId: 'agreement-id'
});

// Get reviews written by user
const written = await reviewsAPI.getByUser('user-id');

// Get reviews for user
const received = await reviewsAPI.getForUser('user-id');
```

**Endpoints:**
- `GET /reviews` - Get all reviews (paginated)
- `GET /reviews/:id` - Get single review
- `POST /reviews` - Create review
- `GET /reviews/user/:id` - Get reviews by user
- `GET /reviews/for/:id` - Get reviews for user

---

### 7. Users API (`src/api/users.ts`)

```typescript
import { usersAPI } from '@/api/users';

// Get user by ID
const user = await usersAPI.getById('user-id');

// Update user
const updated = await usersAPI.update('user-id', {
  name: 'New Name',
  email: 'newemail@example.com'
});

// Get user profile
const profile = await usersAPI.getProfile('user-id');

// Get user's trust score
const trustScore = await usersAPI.getTrustScore('user-id');

// Update profile
const updatedProfile = await usersAPI.updateProfile('user-id', {
  name: 'Updated Name'
});
```

**Endpoints:**
- `GET /users/:id` - Get user
- `PATCH /users/:id` - Update user
- `GET /users/:id/profile` - Get user profile
- `GET /users/:id/trust-score` - Get trust score
- `PATCH /users/:id/profile` - Update profile

---

### 8. Admin API (`src/api/admin.ts`)

```typescript
import { adminAPI } from '@/api/admin';

// User Management
const users = await adminAPI.getAllUsers(1, 20);
const user = await adminAPI.getUserById('user-id');
await adminAPI.suspendUser('user-id');
await adminAPI.activateUser('user-id');

// Listing Moderation
const listings = await adminAPI.getAllListings(1, 20);
const flagged = await adminAPI.getFlaggedListings();
await adminAPI.flagListing('listing-id', 'Fraudulent listing');
await adminAPI.approveListings('listing-id');
await adminAPI.rejectListing('listing-id', 'Low quality images');
await adminAPI.removeListings('listing-id');

// Dispute Management
const disputes = await adminAPI.getAllDisputes(1, 20);

// Trust Scores
const score = await adminAPI.getTrustScore('user-id');
await adminAPI.updateTrustScore('user-id', 85);

// Dashboard
const stats = await adminAPI.getStats();
```

**Endpoints:**
- `GET /admin/users` - Get all users (paginated)
- `GET /admin/users/:id` - Get user
- `PATCH /admin/users/:id/suspend` - Suspend user
- `PATCH /admin/users/:id/activate` - Activate user
- `GET /admin/listings` - Get all listings (paginated)
- `GET /admin/listings/flagged` - Get flagged listings
- `PATCH /admin/listings/:id/flag` - Flag listing
- `PATCH /admin/listings/:id/approve` - Approve listing
- `PATCH /admin/listings/:id/reject` - Reject listing
- `DELETE /admin/listings/:id` - Remove listing
- `GET /admin/disputes` - Get disputes (paginated)
- `GET /admin/trust-scores/:id` - Get trust score
- `PATCH /admin/trust-scores/:id` - Update trust score
- `GET /admin/stats` - Get dashboard statistics

## Token Management

The API client automatically:
1. Attaches `accessToken` from localStorage to all requests as `Authorization: Bearer <token>`
2. Intercepts 401 responses and attempts to refresh using `refreshToken`
3. Removes tokens and redirects to login on auth failure

Access tokens are stored with key: `accessToken`
Refresh tokens are stored with key: `refreshToken`

## Error Handling

```typescript
import { listingsAPI } from '@/api/listings';

try {
  const listing = await listingsAPI.getOne('invalid-id');
} catch (error) {
  if (error.response?.status === 404) {
    console.error('Listing not found');
  } else if (error.response?.status === 401) {
    console.error('Unauthorized - please login');
  } else {
    console.error('Error:', error.message);
  }
}
```

## Types

All responses are fully typed in `src/api/types.ts`. Key types:

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: 'TENANT' | 'LANDLORD' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

interface Listing {
  id: string;
  title: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  // ... more fields
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
```

## Testing Integration

1. Ensure backend is running: `npm run dev` in `apps/backend/`
2. Start frontend dev server: `npm run dev` in `apps/web/`
3. Frontend loads from `http://localhost:5173`
4. API requests go to `http://localhost:3000/api`
5. Open browser DevTools → Network to inspect requests

## Troubleshooting

### CORS Errors
Ensure backend has CORS enabled for `http://localhost:5173`

### Token Issues
- Check if `accessToken` is in localStorage
- Verify backend returns tokens in auth responses
- Check token format: should be JWT

### 404 Errors
- Verify backend endpoints match client routes
- Check if database migrations ran: `npm run prisma:migrate` in backend

### Connection Refused
- Ensure backend is running on port 3000
- Check `VITE_API_URL` in `.env.local`
