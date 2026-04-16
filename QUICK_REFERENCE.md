# Rentra Web - Quick Reference

## 🚀 Start Development

```bash
# Frontend is ALREADY RUNNING on http://localhost:5173
# Just ensure the backend is running:

cd apps/backend
pnpm run dev
# Backend starts on http://localhost:3000
```

## 📡 API Clients Available

All in `src/api/`:
- `auth.ts` - Login, register, token management
- `listings.ts` - Property listings CRUD
- `agreements.ts` - Lease agreements
- `payments.ts` - Payment processing
- `disputes.ts` - Dispute resolution
- `reviews.ts` - User reviews
- `users.ts` - User profiles
- `admin.ts` - Admin operations

## 💡 Quick Examples

### Import and Use
```typescript
import { listingsAPI } from '@/api/listings';

// Get all listings
const { items, total } = await listingsAPI.getAll(1, 10);

// Create listing
const listing = await listingsAPI.create({
  title: '2BR Apartment',
  price: 1500,
  // ... other fields
});
```

### In React Components
```typescript
import { useQuery } from '@tanstack/react-query';
import { listingsAPI } from '@/api/listings';

export function MyListings() {
  const { data, isLoading } = useQuery({
    queryKey: ['listings'],
    queryFn: () => listingsAPI.getAll(1, 10)
  });

  if (isLoading) return <p>Loading...</p>;
  return <div>{/* render data.items */}</div>;
}
```

### Authentication
```typescript
import { authAPI } from '@/api/auth';

// Login
const { user, accessToken } = await authAPI.login({
  email: 'user@example.com',
  password: 'password123'
});

// Logout
authAPI.logout();
```

## 🔧 Configuration

`.env.local`:
```
VITE_API_URL=http://localhost:3000/api
```

## 📦 Frontend Stack

- React 19.2.4 ✅
- TypeScript 5.7 ✅
- Vite 5.4.21 ✅ (Fixed!)
- React Router 7.14 ✅
- Tailwind CSS 3.4 ✅
- Axios 1.15 ✅
- React Query 5.99 ✅
- Zustand 5.0.12 ✅

## 🛠️ Backend Endpoints

**Auth:**
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

**Listings:**
- `GET /listings` - All (paginated)
- `GET /listings/:id` - Single
- `POST /listings` - Create
- `PATCH /listings/:id` - Update
- `DELETE /listings/:id` - Delete

**Agreements:**
- `GET /agreements`
- `POST /agreements`
- `POST /agreements/:id/sign`

**Payments:**
- `GET /payments`
- `POST /payments`
- `GET /payments/my`

**Disputes:**
- `GET /disputes`
- `POST /disputes`
- `POST /disputes/:id/resolve`

**Reviews:**
- `GET /reviews`
- `POST /reviews`

**Admin:**
- `GET /admin/users`
- `GET /admin/listings`
- `PATCH /admin/listings/:id/flag`
- `GET /admin/stats`

## 🎯 Pages Built (9 Total)

### Tenant Pages
- `/tenant` - Dashboard
- `/tenant/listings` - Browse listings
- `/tenant/detector` - AI fraud detector
- `/tenant/estimator` - Rent calculator
- `/tenant/trust` - Trust scores
- `/tenant/agreement` - My agreements
- `/tenant/payments` - Payments
- `/tenant/disputes` - Disputes
- `/tenant/profile` - Profile

### Auth Pages
- `/login` - Login form
- `/register` - Register form

### Landlord Pages
- `/landlord` - Dashboard
- `/landlord/properties` - Manage properties
- `/landlord/post` - Post property
- `/landlord/my-agreements` - Agreements
- (+ others)

### Admin Pages
- `/admin` - Dashboard
- (+ others)

## 📄 Components (7 Total)

- `Button.tsx` - Primary/ghost/danger variants
- `Card.tsx` - Container wrapper
- `Pill.tsx` - Status badges
- `StatCard.tsx` - Stats display
- `DashboardLayout.tsx` - Main layout
- `Sidebar.tsx` - Navigation
- `ProtectedRoute.tsx` - Route guards

## 🔐 Token Management

Automatic:
1. Login → Storage: `accessToken`, `refreshToken`
2. Request → Inject: `Authorization: Bearer <token>`
3. 401 Response → Refresh token
4. Auth Failure → Clear tokens, redirect `/login`

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Dev server won't start | ✅ Fixed (plugin-react@4.3.1) |
| API 404 errors | Start backend: `cd apps/backend && pnpm dev` |
| Token errors | Check localStorage, verify backend response |
| CORS errors | Ensure backend enables CORS for localhost:5173 |
| Build errors | Try: `pnpm install --force` |

## 📚 Full Documentation

See `REST_API_INTEGRATION.md` for:
- Complete API reference
- All endpoint descriptions
- Code examples
- Error handling
- Type definitions

## ✅ Checklist

- [x] Frontend running at 5173
- [x] Vite configured correctly
- [x] TypeScript ready
- [x] All API clients created
- [x] Environment configured
- [x] All pages built
- [x] All components created
- [x] Routing configured
- [ ] Backend running at 3000 (next step)
- [ ] Database migrations (next step)
- [ ] End-to-end testing

## 🚀 Next Steps

1. Start backend: `cd apps/backend && pnpm dev`
2. Open http://localhost:5173
3. Try login/register
4. Create listing (landlord)
5. Browse listings (tenant)
6. Test payments, disputes, reviews

---

**Everything is ready! Just start the backend!**
