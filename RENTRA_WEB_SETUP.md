# Rentra Project - Quick Start Guide

## Project Overview
Rentra is a transparent rental platform with:
- **Tech Stack**: React 19 + TypeScript + Vite + Tailwind CSS
- **UI**: Lucide React icons, custom components
- **State**: Zustand for auth, React Query for data
- **Styling**: Tailwind CSS with dark theme (#0f0f0f background, #22c55e green accent)

## Directory Structure

```
apps/web/src/
├── pages/
│   ├── auth/              # Login, Register
│   ├── tenant/            # 9 pages (Dashboard, Browse Listings, Detector, Estimator, Trust Scores, Agreements, Payments, Disputes, Profile)
│   ├── landlord/          # Dashboard (others to be created as needed)
│   └── admin/             # Dashboard (others to be created as needed)
├── components/
│   ├── layout/            # DashboardLayout, Sidebar, ProtectedRoute
│   ├── ui/                # StatCard, Card, Pill, Button
│   └── shared/            # Shared components
├── api/                   # API clients (auth, listings, etc.)
├── store/                 # Zustand auth store
├── types/                 # TypeScript types & enums
├── utils/                 # Helper functions
├── App.tsx                # Main routing
└── main.tsx               # Entry point with React Query
```

## Features Implemented

### ✅ Completed
1. **Authentication Pages**: Login, Register with role selection (Tenant/Landlord/Admin)
2. **Tenant Dashboard**: Stats cards, recent listings, recent activity
3. **Tenant Pages** (All 9):
   - Browse Listings - Grid view with filters & badges
   - AI Fake Detector - Fraud detection signals & review queue
   - Rent Estimator - Fair rent calculation with comparisons
   - Trust Scores - Tenant & landlord trust metrics
   - Digital Agreements - Agreement preview & download
   - Payments - Payment history & payment form
   - Disputes - Active disputes with chat
   - Profile - User info & trust breakdown
4. **Landlord Dashboard**: Properties management, tenant info
5. **Admin Dashboard**: Moderation queue, user management, platform stats
6. **UI Components**: Fully styled with dark theme
7. **Responsive Layout**: Sidebar navigation, topbar, content area
8. **Icons**: All from lucide-react

### 🔶 Partially Done
- Landlord additional pages (exist as stubs)
- Admin additional pages (exist as stubs)

### ⏳ To Do (If Needed)
- Landlord: My Properties, Post Property, Agreements, Payments, Disputes, Profile
- Admin: All Listings, Moderation, Users, Disputes, Trust Scores, Profile

## Running the Project

### Setup
```bash
# Root directory
cd e:\Rentra
pnpm install
pnpm run dev
```

### Development
Navigate to `http://localhost:5173` (default Vite port)

### Build
```bash
pnpm run build
```

## Key Design Decisions

1. **Dark Theme**: #0f0f0f background with #171717 cards, green accent (#22c55e)
2. **Component-Based**: Reusable UI components (Card, Pill, StatCard, Button)
3. **Responsive Grid**: Layout uses Tailwind grid (grid-cols-2, grid-cols-3, grid-cols-4)
4. **Icons**: All from lucide-react (14-15px size)
5. **Accessibility**: Semantic HTML, proper form labels (though some eslint warnings remain)
6. **Dynamic Data**: Mock data used for demonstration, ready for API integration

## Known Issues & Notes

1. **ESLint Warnings**: Accessibility-related (missing labels, inline styles) - can be addressed if needed
2. **Dependencies**: All required packages are in package.json:
   - react, react-dom, react-router-dom
   - zustand (state management)
   - @tanstack/react-query (data fetching)
   - lucide-react (icons)
   - react-hot-toast (notifications)
   - tailwindcss (styling)
   -typescript, vite (@vitejs/plugin-react)

3. **Naming**: All text/content in English as per requirements, including Urdu phrases for user copy

## File Statistics
- **Pages Created**: 9 tenant pages, 1 landlord, 1 admin dashboard
- **UI Components**: 4 reusable components
- **Routes**: ~20+ routes defined
- **Lines of Code**: ~3000+ lines across components

## Testing the App

1. **Auth Flow**: 
   - Go to /login, enter credentials
   - Or /register to create new account
   - Select role (TENANT/LANDLORD/ADMIN)

2. **Navigation**:
   - Sidebar shows role-specific nav
   - Click items to navigate between pages
   - URL updates accordingly (/tenant/listings, /tenant/disputes, etc.)

3. **UI/UX**:
   - All pages follow wireframe design
   - Dark theme consistent across app
   - Form inputs, tables, cards all styled
   - Icons and badges properly displayed

## Connection to Backend

The following API calls are ready to be wired up:
- `/api/auth/login` - Login
- `/api/auth/register` - Registration
- `/api/listings` - Property listings
- `/api/agreements` - Rent agreements
- `/api/payments` - Payment history & processing
- `/api/disputes` - Dispute management
- `/api/trust-scores` - User trust metrics

All API methods are defined in `src/api/` directory (axios client with auth).

## Deployment Ready

The project is ready for:
- Development: `pnpm run dev`
- Production build: `pnpm run build`
- Docker containerization (if needed)
- Deployment to Vercel, Netlify, or any static host

---

**Last Updated**: April 14, 2026
**Status**: ✅ Ready for testing and backend integration
