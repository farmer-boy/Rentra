# Rentra Project - CRUD, Authentication & Authorization Exploration

## 📊 Project Overview
Rentra is a comprehensive rental platform with:
- **NestJS Backend** (e:\Rentra\apps\backend) - REST API with authentication & CRUD operations
- **React Frontend** (e:\Rentra\apps\web) - Protected routes with role-based access
- **PostgreSQL Database** - Managed via Prisma ORM
- **Three User Roles**: TENANT, LANDLORD, ADMIN

---

## 1️⃣ DATABASE SCHEMA & MODELS

### Location: [apps/backend/prisma/schema.prisma](apps/backend/prisma/schema.prisma)

**Core Models:**

| Model | Purpose | Key Fields |
|-------|---------|-----------|
| **User** | All users | id, email, phone, password (hashed), fullName, cnic, role, trustScore, isVerified, isSuspended |
| **Listing** | Property listings | id, title, description, city, address, type, bedrooms, bathrooms, sqft, rent, deposit, landlordId |
| **Agreement** | Rental agreements | id, listingId, tenantId, landlordId, rent, deposit, status, pdfUrl |
| **Payment** | Rent payments | id, agreementId, tenantId, amount, method, status, month |
| **Dispute** | Tenant disputes | id, agreementId, tenantId, title, description, status, resolution |
| **Review** | User reviews | id, listingId, userId, rating, comment |
| **Conversation** | Messaging threads | id, participant1Id, participant2Id, messages |
| **Message** | Chat messages | id, conversationId, senderId, content, isRead |

**Enums:**
- `Role` - TENANT, LANDLORD, ADMIN
- `PropertyType` - Apartment, House, etc.
- `ListingStatus` - PENDING, ACTIVE, RENTED, ARCHIVED
- `AgreementStatus` - PENDING, APPROVED, ACTIVE, TERMINATED, COMPLETED
- `PaymentStatus` - PENDING, COMPLETED, FAILED
- `DisputeStatus` - OPEN, RESOLVED, CLOSED
- `PaymentMethod` - BANK_TRANSFER, EASYPAISA, JAZZCASH, CARD

---

## 2️⃣ AUTHENTICATION IMPLEMENTATION

### JWT/Token Implementation

**Location:** [apps/backend/src/modules/auth](apps/backend/src/modules/auth)

#### JWT Strategy
- **File:** [auth/strategies/jwt.strategy.ts](apps/backend/src/modules/auth/strategies/jwt.strategy.ts)
- **Type:** Passport JWT Strategy
- **Extraction:** Bearer token from Authorization header
- **Secret:** `JWT_SECRET` environment variable
- **Expiration:** Configurable via `JWT_EXPIRES_IN` (default: 7 days)
- **Payload Structure:**
  ```typescript
  interface JwtPayload {
    sub: string;      // User ID
    email: string;
    role: string;
    iat?: number;     // Issued at
    exp?: number;     // Expiration
  }
  ```

#### JWT Guard
- **File:** [auth/guards/jwt-auth.guard.ts](apps/backend/src/modules/auth/guards/jwt-auth.guard.ts)
- **Purpose:** Validates JWT tokens on protected routes
- **Extends:** Passport's `AuthGuard('jwt')`

#### Roles Guard
- **File:** [common/guards/roles.guard.ts](apps/backend/src/common/guards/roles.guard.ts)
- **Purpose:** Restricts access based on user role
- **Usage:** Works with `@Roles()` decorator
- **Example:**
  ```typescript
  @Get('admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async adminOnly() { }
  ```

### Auth Service

**File:** [auth/auth.service.ts](apps/backend/src/modules/auth/auth.service.ts)

**Key Methods:**

1. **register(dto: RegisterDto)**
   - Validates unique email, phone, CNIC
   - Hashes password using bcryptjs (salt rounds: 12)
   - Creates user with TENANT role by default
   - Returns user object + JWT token
   - **Error Handling:** ConflictException for duplicates

2. **login(dto: LoginDto)**
   - Validates email existence
   - Checks if account is suspended
   - Compares password using bcrypt.compare()
   - Generates JWT token on success
   - **Error Handling:** UnauthorizedException for invalid credentials

3. **getMe(userId: string)**
   - Retrieves current user profile
   - Protected endpoint (requires JwtAuthGuard)

4. **generateToken(userId, email, role)**
   - Creates JWT with 7-day expiration
   - Uses JwtService.sign()

5. **sanitizeUser(user)**
   - Removes password field from response
   - Returns safe user data

### Auth Controller

**File:** [auth/auth.controller.ts](apps/backend/src/modules/auth/auth.controller.ts)

```typescript
POST   /auth/register  → register(dto: RegisterDto)
POST   /auth/login     → login(dto: LoginDto)
GET    /auth/me        → getMe() [Protected with JwtAuthGuard]
```

### Auth DTOs

**Register DTO:** [auth/dto/register.dto.ts](apps/backend/src/modules/auth/dto/register.dto.ts)
```typescript
{
  fullName: string;      // Validated: string
  email: string;         // Validated: email format
  phone: string;         // Validated: string
  cnic: string;          // Validated: string (35202-1234567-1)
  password: string;      // Validated: min 6 chars
  role?: 'TENANT' | 'LANDLORD';  // Default: TENANT
}
```

**Login DTO:** [auth/dto/login.dto.ts](apps/backend/src/modules/auth/dto/login.dto.ts)
```typescript
{
  email: string;         // Validated: email format
  password: string;      // Validated: string
}
```

### Auth Module Configuration

**File:** [auth/auth.module.ts](apps/backend/src/modules/auth/auth.module.ts)

```typescript
Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: (configService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '7d' }
      })
    })
  ],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule]
})
```

---

## 3️⃣ CRUD OPERATIONS BY MODULE

### Users Module
**Location:** [modules/users](apps/backend/src/modules/users)

| Endpoint | Method | Auth | Role | Purpose |
|----------|--------|------|------|---------|
| `/users` | POST | ❌ | - | Create user |
| `/users` | GET | ❌ | - | Get all users |
| `/users/:id` | GET | ❌ | - | Get user by ID |
| `/users/:id` | PUT | ✅ | - | Replace user |
| `/users/:id` | PATCH | ✅ | - | Update user |
| `/users/:id/trust-score` | PATCH | ✅ | - | Update trust score |
| `/users/:id/suspend` | POST | ✅ | ADMIN | Suspend user account |

**Service:** [users/users.service.ts](apps/backend/src/modules/users/users.service.ts)
- `create(dto)` - Creates user with password hashing
- `findAll()` - Returns all users (excluding passwords)
- `findById(id)` - Single user lookup
- `update(id, dto)` - Updates user fields
- `updateTrustScore(id, score)` - Sets trust score
- `suspendUser(id)` - Marks account as suspended

---

### Listings Module
**Location:** [modules/listings](apps/backend/src/modules/listings)

| Endpoint | Method | Auth | Role | Purpose |
|----------|--------|------|------|---------|
| `/listings` | POST | ✅ | LANDLORD | Create property listing |
| `/listings` | GET | ❌ | - | Browse all listings (with filters) |
| `/listings/:id` | GET | ❌ | - | Get listing details |
| `/listings/:id` | PATCH | ✅ | LANDLORD | Update listing (ownership check) |
| `/listings/:id` | DELETE | ✅ | LANDLORD | Delete listing (ownership check) |
| `/listings?city=&type=` | GET | ❌ | - | Filter listings by city/type |

**Service:** [listings/listings.service.ts](apps/backend/src/modules/listings/listings.service.ts)
- `create(landlordId, dto)` - Creates listing for landlord
- `findAll(filters)` - Search with city/type filters
- `findById(id)` - Single listing with landlord info
- `update(id, landlordId, dto)` - Updates (verifies ownership)
- `delete(id, landlordId)` - Deletes (verifies ownership)
- `getByLandlord(landlordId)` - Listings by landlord

---

### Agreements Module
**Location:** [modules/agreements](apps/backend/src/modules/agreements)

| Endpoint | Method | Auth | Role | Purpose |
|----------|--------|------|------|---------|
| `/agreements` | POST | ✅ | - | Create rental agreement |
| `/agreements` | GET | ✅ | - | Get all agreements |
| `/agreements/:id` | GET | ✅ | - | Get agreement details |
| `/agreements/:id/approve` | PATCH | ✅ | LANDLORD | Approve agreement |
| `/agreements/:id/reject` | PATCH | ✅ | LANDLORD | Reject agreement |
| `/agreements/:id/terminate` | PATCH | ✅ | - | Terminate agreement |

**Service:** [agreements/agreements.service.ts](apps/backend/src/modules/agreements/agreements.service.ts)
- `create(tenantId, landlordId, listingId, ...)` - Creates agreement
- `findAll()` - Returns all agreements
- `findById(id)` - Single agreement details
- `approve(id)` - Sets status to APPROVED
- `reject(id)` - Sets status to REJECTED
- `terminate(id)` - Sets status to TERMINATED

---

### Payments Module
**Location:** [modules/payments](apps/backend/src/modules/payments)

| Endpoint | Method | Auth | Role | Purpose |
|----------|--------|------|------|---------|
| `/payments` | POST | ✅ | TENANT | Create payment |
| `/payments` | GET | ✅ | - | Get all payments |
| `/payments/:id` | GET | ✅ | - | Get payment details |
| `/payments/:id/complete` | PATCH | ✅ | - | Mark payment complete |
| `/payments/:id/fail` | PATCH | ✅ | - | Mark payment failed |

**Service:** [payments/payments.service.ts](apps/backend/src/modules/payments/payments.service.ts)
- `create(tenantId, amount, method, agreementId)` - Creates payment
- `findAll()` - Returns all payments
- `findById(id)` - Single payment details
- `complete(id)` - Sets status to COMPLETED
- `fail(id)` - Sets status to FAILED
- `getByTenant(tenantId)` - Payments by tenant

**Payment Methods:** BANK_TRANSFER, EASYPAISA, JAZZCASH, CARD

---

### Disputes Module
**Location:** [modules/disputes](apps/backend/src/modules/disputes)

| Endpoint | Method | Auth | Role | Purpose |
|----------|--------|------|------|---------|
| `/disputes` | POST | ✅ | TENANT | File dispute |
| `/disputes` | GET | ✅ | - | Get all disputes |
| `/disputes/:id` | GET | ✅ | - | Get dispute details |
| `/disputes/:id/resolve` | PATCH | ✅ | ADMIN | Resolve dispute |
| `/disputes/:id/close` | PATCH | ✅ | - | Close dispute |

**Service:** [disputes/disputes.service.ts](apps/backend/src/modules/disputes/disputes.service.ts)
- `create(tenantId, agreementId, title, description)` - Files dispute
- `findAll()` - Returns all disputes
- `findById(id)` - Single dispute details
- `resolve(id, resolution)` - Sets status to RESOLVED
- `close(id)` - Sets status to CLOSED

---

### Reviews Module
**Location:** [modules/reviews](apps/backend/src/modules/reviews)

| Endpoint | Method | Auth | Role | Purpose |
|----------|--------|------|------|---------|
| `/reviews` | POST | ✅ | - | Create review |
| `/reviews` | GET | ❌ | - | Get all reviews |
| `/reviews/:id` | GET | ❌ | - | Get review details |
| `/reviews/listing/:listingId` | GET | ❌ | - | Get listing reviews |
| `/reviews/:id` | DELETE | ✅ | - | Delete own review |

**Service:** [reviews/reviews.service.ts](apps/backend/src/modules/reviews/reviews.service.ts)
- `create(userId, listingId, rating, comment)` - Creates review
- `findAll()` - Returns all reviews
- `findById(id)` - Single review details
- `findByListing(listingId)` - Reviews for listing
- `delete(id, userId)` - Deletes (ownership check)

---

### Messages Module
**Location:** [modules/messages](apps/backend/src/modules/messages)

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/messages/conversation/:otherUserId` | POST | ✅ | Get or create conversation |
| `/messages/conversations` | GET | ✅ | Get user's conversations |
| `/messages/conversation/:conversationId` | GET | ✅ | Get messages in conversation |
| `/messages/conversation/:conversationId/send` | POST | ✅ | Send message |
| `/messages/unread-count` | GET | ✅ | Get unread count |
| `/messages/conversation/:conversationId/read` | POST | ✅ | Mark as read |

**Service:** [messages/messages.service.ts](apps/backend/src/modules/messages/messages.service.ts)
- `getOrCreateConversation(userId1, userId2, listingId?)` - Creates unique conversation
- `getUserConversations(userId)` - User's message threads
- `getConversationMessages(conversationId, userId, limit, offset)` - Paginated messages
- `sendMessage(conversationId, senderId, dto)` - Sends message
- `getUnreadCount(userId)` - Unread messages
- `markConversationAsRead(conversationId, userId)` - Marks messages read

---

### Contact Module
**Location:** [modules/contact](apps/backend/src/modules/contact)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/contact` | POST | Submit contact form |

Stores contact messages in database for admin review.

---

## 4️⃣ DECORATORS & MIDDLEWARE

### Custom Decorators

**CurrentUser Decorator**
- **File:** [common/decorators/current-user.decorator.ts](apps/backend/src/common/decorators/current-user.decorator.ts)
- **Purpose:** Extracts JwtPayload from request.user
- **Usage:**
  ```typescript
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: JwtPayload) {
    return user;
  }
  ```

**Roles Decorator**
- **File:** [common/decorators/roles.decorator.ts](apps/backend/src/common/decorators/roles.decorator.ts)
- **Purpose:** Sets required roles via metadata
- **Usage:**
  ```typescript
  @Roles('ADMIN', 'LANDLORD')
  @UseGuards(JwtAuthGuard, RolesGuard)
  adminEndpoint() { }
  ```

---

## 5️⃣ USER ROLES & PERMISSIONS

### Three-Tier Role System

| Role | Capabilities | Access |
|------|-------------|--------|
| **TENANT** | Browse listings, Apply for agreements, Pay rent, File disputes, Message landlords, Leave reviews | Public listings, Own agreements/payments/disputes |
| **LANDLORD** | Post listings, Manage tenants, Accept/reject agreements, Receive payments, Manage disputes, Message tenants | Own listings only, All tenant applications |
| **ADMIN** | Full platform control, Resolve disputes, Suspend users, View analytics, Manage content | All data, All users, All transactions |

### Role-Based Access Examples

```typescript
// Only ADMIN can access
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Get('admin/users')
getAllUsers() { }

// LANDLORD or TENANT can access but with ownership verification
@UseGuards(JwtAuthGuard)
@Patch('listings/:id')
updateListing(@CurrentUser() user, @Param('id') id) {
  // Service verifies user.sub === listing.landlordId
}

// Public endpoint (no auth required)
@Get('listings')
getListings() { }
```

---

## 6️⃣ FRONTEND LOGIN/SIGNUP FLOW

### Login Flow

**File:** [web/src/pages/auth/Login.tsx](apps/web/src/pages/auth/Login.tsx)

1. User enters email & password
2. Form validates inputs
3. Calls `authAPI.login(email, password)`
4. Backend validates credentials & returns:
   ```json
   {
     "message": "Login successful! Welcome back 👋",
     "user": { id, email, role, fullName, ... },
     "accessToken": "eyJhbGc..."
   }
   ```
5. Frontend stores token in `localStorage.accessToken`
6. Zustand store updates via `login(user, token)`
7. Redirects based on role:
   - ADMIN → `/admin`
   - LANDLORD → `/landlord`
   - TENANT → `/tenant`

### Signup Flow

**File:** [web/src/pages/auth/Register.tsx](apps/web/src/pages/auth/Register.tsx)

1. User fills full registration form:
   - Full Name
   - Email
   - Phone
   - CNIC
   - Password (min 6 chars)
   - Account Type (Tenant/Landlord)

2. Form validates all fields
3. Calls `authAPI.register(formData)`
4. Backend creates user with hashed password
5. Returns same response as login
6. Stores token & redirects based on role

### API Integration

**File:** [web/src/api/auth.ts](apps/web/src/api/auth.ts)

```typescript
export const authAPI = {
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    localStorage.setItem('accessToken', response.data.accessToken);
    return response.data;
  },

  login: async (data) => {
    const response = await api.post('/auth/login', data);
    localStorage.setItem('accessToken', response.data.accessToken);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  }
};
```

---

## 7️⃣ PROTECTED ROUTES & STATE MANAGEMENT

### Zustand Auth Store

**File:** [web/src/store/authStore.ts](apps/web/src/store/authStore.ts)

```typescript
export const useAuthStore = create<AuthState>((set) => ({
  user: localStorage.getItem('user') ? JSON.parse(...) : null,
  token: localStorage.getItem('accessToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),

  login: (user: User, token: string) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  }
}));
```

### Protected Route Component

**File:** [web/src/components/layout/ProtectedRoute.tsx](apps/web/src/components/layout/ProtectedRoute.tsx)

```typescript
export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { isAuthenticated, user } = useAuthStore();

  // Redirect to login if not authenticated
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Check role authorization
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'LANDLORD') return <Navigate to="/landlord" replace />;
    return <Navigate to="/tenant" replace />;
  }

  return <>{children}</>;
}
```

### Usage in Routes

**File:** [web/src/App.tsx](apps/web/src/App.tsx)

```typescript
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  
  {/* Tenant routes */}
  <Route element={<ProtectedRoute allowedRoles={['TENANT']}>
    <DashboardLayout />
  </ProtectedRoute>}>
    <Route path="/tenant" element={<TenantDashboard />} />
    <Route path="/tenant/listings" element={<BrowseListings />} />
    <Route path="/tenant/payments" element={<Payments />} />
  </Route>

  {/* Landlord routes */}
  <Route element={<ProtectedRoute allowedRoles={['LANDLORD']}>
    <AdminLayout />
  </ProtectedRoute>}>
    <Route path="/landlord" element={<LandlordDashboard />} />
    <Route path="/landlord/properties" element={<MyProperties />} />
  </Route>

  {/* Admin routes */}
  <Route element={<ProtectedRoute allowedRoles={['ADMIN']}>
    <AdminLayout />
  </ProtectedRoute>}>
    <Route path="/admin" element={<AdminDashboard />} />
    <Route path="/admin/users" element={<AdminAllUsers />} />
  </Route>
</Routes>
```

---

## 8️⃣ API CLIENT CONFIGURATION

**File:** [web/src/api/client.ts](apps/web/src/api/client.ts)

```typescript
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto-attach JWT token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors (expired token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 9️⃣ VALIDATION & ERROR HANDLING

### Backend Validation
- **Email:** Standard email format (class-validator @IsEmail)
- **Password:** Min 6 characters, hashed with bcryptjs (12 rounds)
- **Phone:** String format
- **CNIC:** String format (Pakistani format: 35202-1234567-1)
- **Unique Constraints:** Email, Phone, CNIC must be unique per user

### Error Responses
- **409 Conflict:** Duplicate email/phone/CNIC
- **401 Unauthorized:** Invalid credentials or suspended account
- **403 Forbidden:** Insufficient role permissions
- **404 Not Found:** Resource not found
- **400 Bad Request:** Invalid input or ownership verification failed

### Frontend Error Handling
- Toast notifications for user feedback
- Try-catch blocks on all API calls
- Loading states during async operations
- Role-based redirect on 403 errors

---

## 🔟 APP MODULE STRUCTURE

**File:** [backend/src/app.module.ts](apps/backend/src/app.module.ts)

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,      // Database ORM
    AuthModule,        // Authentication
    UsersModule,       // User CRUD
    ListingsModule,    // Property listings
    AgreementsModule,  // Rental agreements
    PaymentsModule,    // Payment tracking
    DisputesModule,    // Dispute management
    ReviewsModule,     // User reviews
    ContactModule,     // Contact form
    MessagesModule,    // Messaging system
  ],
})
export class AppModule {}
```

---

## 📁 KEY FILES SUMMARY TABLE

### Backend Authentication Files
| File | Purpose |
|------|---------|
| [auth/auth.service.ts](apps/backend/src/modules/auth/auth.service.ts) | Register, login, getMe, token generation |
| [auth/auth.controller.ts](apps/backend/src/modules/auth/auth.controller.ts) | Auth endpoints (POST register, POST login, GET me) |
| [auth/auth.module.ts](apps/backend/src/modules/auth/auth.module.ts) | JWT/Passport configuration |
| [auth/strategies/jwt.strategy.ts](apps/backend/src/modules/auth/strategies/jwt.strategy.ts) | JWT validation & user extraction |
| [auth/guards/jwt-auth.guard.ts](apps/backend/src/modules/auth/guards/jwt-auth.guard.ts) | JWT token verification guard |
| [common/guards/roles.guard.ts](apps/backend/src/common/guards/roles.guard.ts) | Role-based access control |
| [common/decorators/current-user.decorator.ts](apps/backend/src/common/decorators/current-user.decorator.ts) | Extract user from request |
| [common/decorators/roles.decorator.ts](apps/backend/src/common/decorators/roles.decorator.ts) | Set required roles for endpoint |

### Backend CRUD Service Files
| Service | CRUD Operations |
|---------|-----------------|
| [users/users.service.ts](apps/backend/src/modules/users/users.service.ts) | Create, Read (all/single), Update, Suspend |
| [listings/listings.service.ts](apps/backend/src/modules/listings/listings.service.ts) | Create, Read (all/single/filter), Update, Delete, GetByLandlord |
| [agreements/agreements.service.ts](apps/backend/src/modules/agreements/agreements.service.ts) | Create, Read (all/single), Approve, Reject, Terminate |
| [payments/payments.service.ts](apps/backend/src/modules/payments/payments.service.ts) | Create, Read (all/single), Complete, Fail, GetByTenant |
| [disputes/disputes.service.ts](apps/backend/src/modules/disputes/disputes.service.ts) | Create, Read (all/single), Resolve, Close |
| [reviews/reviews.service.ts](apps/backend/src/modules/reviews/reviews.service.ts) | Create, Read (all/single/byListing), Delete |
| [messages/messages.service.ts](apps/backend/src/modules/messages/messages.service.ts) | GetOrCreateConversation, SendMessage, MarkAsRead |

### Frontend Authentication Files
| File | Purpose |
|------|---------|
| [web/src/pages/auth/Login.tsx](apps/web/src/pages/auth/Login.tsx) | Login form & flow |
| [web/src/pages/auth/Register.tsx](apps/web/src/pages/auth/Register.tsx) | Registration form & flow |
| [web/src/api/auth.ts](apps/web/src/api/auth.ts) | Auth API client (register, login, logout) |
| [web/src/api/client.ts](apps/web/src/api/client.ts) | Axios instance with token interceptor |
| [web/src/store/authStore.ts](apps/web/src/store/authStore.ts) | Zustand auth state management |

### Frontend Protected Routes
| File | Purpose |
|------|---------|
| [web/src/components/layout/ProtectedRoute.tsx](apps/web/src/components/layout/ProtectedRoute.tsx) | Wraps routes requiring authentication |
| [web/src/components/layout/DashboardLayout.tsx](apps/web/src/components/layout/DashboardLayout.tsx) | Sidebar + navbar for authenticated users |
| [web/src/App.tsx](apps/web/src/App.tsx) | Route configuration with role-based access |

---

## 🔒 SECURITY FEATURES

✅ **Password Hashing:** bcryptjs with 12 salt rounds
✅ **JWT Tokens:** 7-day expiration, Bearer token extraction
✅ **Role-Based Access:** Three-tier system (TENANT/LANDLORD/ADMIN)
✅ **Ownership Verification:** Listings, agreements verified before update/delete
✅ **Account Suspension:** Users can be suspended, preventing login
✅ **Token Storage:** LocalStorage with interceptor-based attachment
✅ **Unique Constraints:** Email, phone, CNIC uniqueness enforced
✅ **Protected Endpoints:** All mutation endpoints require JwtAuthGuard
✅ **Frontend Route Protection:** ProtectedRoute component blocks unauthorized access
✅ **Automatic Logout:** 401 response triggers localStorage cleanup

---

## 🚀 DEVELOPMENT URLS

- **Backend API:** http://localhost:3000/api
- **Swagger Docs:** http://localhost:3000/api/docs
- **Frontend:** http://localhost:5173
- **Database:** PostgreSQL (configured in .env)

---

## 📝 ENVIRONMENT VARIABLES (Required)

```env
# Backend (.env in apps/backend)
DATABASE_URL=postgresql://user:password@localhost:5432/rentra
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

# Frontend uses http://localhost:3000/api
```

---

**Last Updated:** April 2026
**Status:** Fully Implemented ✅
