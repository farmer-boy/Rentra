import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

// Context
import { ThemeProvider } from './context/ThemeContext';

// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import PasswordRecovery from './pages/auth/PasswordRecovery';
import VerifyEmail from './pages/auth/VerifyEmail';
import HomePage from './pages/home/HomePage';
import Contact from './pages/contact/Contact';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';
import { getUnifiedNavSections } from './components/layout/unifiedNavSections';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Shared
import SettingsPage from './pages/settings/SettingsPage';

// Tenant Pages
import UnifiedDashboard from './pages/dashboard/UnifiedDashboard';
import BrowseListings from './pages/tenant/BrowseListings';
import ListingDetails from './pages/tenant/ListingDetails';
import PublicListingsLayout from './components/layout/PublicListingsLayout';
import SavedListings from './pages/tenant/SavedListings';
import SavedSearches from './pages/tenant/SavedSearches';
import TenantRentalRequests from './pages/tenant/RentalRequests';
import TenantBookings from './pages/tenant/Bookings';
import AIDetector from './pages/tenant/AIDetector';
import RentEstimator from './pages/tenant/RentEstimator';
import TrustScores from './pages/tenant/TrustScores';
import Agreements from './pages/tenant/Agreements';
import Payments from './pages/tenant/Payments';
import Disputes from './pages/tenant/Disputes';
import MaintenanceRequests from './pages/tenant/MaintenanceRequests';
import Profile from './pages/tenant/Profile';
import ReviewsAndRatings from './pages/tenant/ReviewsAndRatings';
import PostProperty from './pages/tenant/PostProperty';

// Landlord Pages
import LandlordProfile from './pages/landlord/Profile';
import LandlordPostProperty from './pages/landlord/PostProperty';
import MyProperties from './pages/landlord/MyProperties';
import MyTenants from './pages/landlord/MyTenants';
import PendingApplications from './pages/landlord/PendingApplications';
import LandlordAgreements from './pages/landlord/Agreements';
import PaymentsReceived from './pages/landlord/PaymentsReceived';
import IncomeReport from './pages/landlord/IncomeReport';
import LandlordMaintenanceRequests from './pages/landlord/MaintenanceRequests';
import LandlordFakeDetector from './pages/landlord/FakeDetector';
import LandlordTrustScores from './pages/landlord/TrustScores';
import LandlordReviews from './pages/landlord/Reviews';
import LandlordBookings from './pages/landlord/Bookings';
import LandlordAvailability from './pages/landlord/Availability';
import LandlordVerification from './pages/landlord/Verification';
import RentraBoost from './pages/landlord/RentraBoost';
import ChatPage from './pages/messages/ChatPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProfile from './pages/admin/Profile';
import AdminAllUsers from './pages/admin/AllUsers';
import AdminUserDetails from './pages/admin/AdminUserDetails';
import AdminAllDisputes from './pages/admin/AllDisputes';
import AdminPlatformAnalytics from './pages/admin/PlatformAnalytics';
import AdminMessages from './pages/admin/Messages';
import AdminResourcePage from './pages/admin/AdminResourcePage';
import VerificationQueue from './pages/admin/VerificationQueue';
import NotificationsPage from './pages/notifications/NotificationsPage';
import SupportPage from './pages/support/SupportPage';
import SupportTickets from './pages/admin/SupportTickets';
import { useAuthStore } from './store/authStore';
import type { Role } from './types';

function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-5 text-center text-[var(--text)]">
      <div className="max-w-md">
        <p className="text-sm font-semibold uppercase tracking-widest text-[var(--green-soft)]">404 · Page not found</p>
        <h1 className="mt-3 text-3xl font-semibold">We couldn't find that page.</h1>
        <p className="mt-3 text-sm leading-6 text-text-muted">The link may be outdated, or the address may have been typed incorrectly.</p>
        <Link to="/" className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-contrast hover:bg-primary-hover">Go to Rentra home</Link>
      </div>
    </main>
  );
}

function HomeEntry() {
  const { user, isInitialized } = useAuthStore();
  if (!isInitialized) return <div role="status" className="p-6 text-center">Restoring your session…</div>;
  const roles = user?.roles ?? (user?.role ? [user.role] : []);
  return roles.includes('ADMIN') ? <Navigate to="/admin" replace /> : <HomePage />;
}

function LegacyWorkspaceRedirect({ workspace }: { workspace: 'tenant' | 'landlord' }) {
  const { pathname, search, hash } = useLocation();
  const subpath = pathname.replace(new RegExp(`^/${workspace}/?`), '').replace(/\/$/, '');
  const mappings: Record<string, string> = workspace === 'tenant'
    ? {
        '': '', listings: 'listings', saved: 'saved', 'saved-searches': 'saved-searches',
        post: 'enable-hosting', 'rental-requests': 'my-requests', bookings: 'my-bookings',
        messages: 'messages', notifications: 'notifications', detector: 'fake-detector',
        estimator: 'rent-estimator', trust: 'trust-scores', agreement: 'my-agreements',
        payments: 'my-payments', disputes: 'disputes', maintenance: 'my-maintenance',
        profile: 'profile', reviews: 'my-reviews', settings: 'settings',
      }
    : {
        '': '', properties: 'properties', post: 'post-property', boost: 'boost',
        bookings: 'property-bookings', availability: 'availability', verification: 'host-verification',
        messages: 'messages', notifications: 'notifications', tenants: 'tenants',
        applications: 'received-requests', agreements: 'property-agreements', payments: 'received-payments',
        income: 'income', estimator: 'rent-estimator', detector: 'host-detector', trust: 'host-trust',
        maintenance: 'property-maintenance', profile: 'host-profile', reviews: 'host-reviews', settings: 'settings',
      };
  const listingDetails = subpath.match(/^listings\/([^/]+)$/);
  const destination = listingDetails
    ? `/dashboard/listings/${listingDetails[1]}`
    : mappings[subpath] !== undefined
      ? `/dashboard${mappings[subpath] ? `/${mappings[subpath]}` : ''}`
      : '/dashboard';

  return <Navigate to={`${destination}${search}${hash}`} replace />;
}

function LandlordCapabilityRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={['LANDLORD']}>{children}</ProtectedRoute>;
}

function NonAdminLandlordRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const roles = user?.roles ?? (user?.role ? [user.role] : []);
  return roles.includes('ADMIN') ? <Navigate to="/admin" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const initializeAuth = useAuthStore((state) => state.initialize);
  const user = useAuthStore((state) => state.user);
  const userRoles: Role[] = user?.roles ?? (user?.role ? [user.role] : []);
  const dashboardNavSections = getUnifiedNavSections(userRoles.includes('LANDLORD'), userRoles.includes('ADMIN'));

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--surface)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            fontSize: '13px'
          },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomeEntry />} />
        <Route element={<PublicListingsLayout />}>
          <Route path="/listings" element={<ProtectedRoute allowedRoles={['TENANT', 'LANDLORD']}><BrowseListings /></ProtectedRoute>} />
          <Route path="/listings/:id" element={<ProtectedRoute allowedRoles={['TENANT', 'LANDLORD']}><ListingDetails /></ProtectedRoute>} />
        </Route>
        <Route element={<PublicListingsLayout />}>
          <Route path="/favorites" element={<ProtectedRoute allowedRoles={['TENANT', 'LANDLORD']}><SavedListings /></ProtectedRoute>} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<PasswordRecovery />} />
        <Route path="/reset-password" element={<PasswordRecovery />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/help" element={<Contact />} />

        {/* Shared - Settings */}
        <Route path="/settings" element={
          <ProtectedRoute allowedRoles={['TENANT', 'LANDLORD']}>
            <SettingsPage />
          </ProtectedRoute>
        } />

        {/* One shared tenant and landlord dashboard */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['TENANT', 'LANDLORD']}>
            <DashboardLayout navSections={dashboardNavSections} />
          </ProtectedRoute>
        }>
          <Route index element={<UnifiedDashboard />} />
          <Route path="listings" element={<BrowseListings />} />
          <Route path="listings/:id" element={<ListingDetails />} />
          <Route path="saved" element={<SavedListings />} />
          <Route path="saved-searches" element={<SavedSearches />} />
          <Route path="enable-hosting" element={<NonAdminLandlordRoute><PostProperty /></NonAdminLandlordRoute>} />
          <Route path="post-property" element={<NonAdminLandlordRoute><LandlordPostProperty /></NonAdminLandlordRoute>} />
          <Route path="properties" element={<LandlordCapabilityRoute><MyProperties /></LandlordCapabilityRoute>} />
          <Route path="received-requests" element={<LandlordCapabilityRoute><PendingApplications /></LandlordCapabilityRoute>} />
          <Route path="my-requests" element={<TenantRentalRequests />} />
          <Route path="my-bookings" element={<TenantBookings />} />
          <Route path="property-bookings" element={<LandlordCapabilityRoute><LandlordBookings /></LandlordCapabilityRoute>} />
          <Route path="availability" element={<LandlordCapabilityRoute><LandlordAvailability /></LandlordCapabilityRoute>} />
          <Route path="my-agreements" element={<Agreements />} />
          <Route path="rental-history" element={<Agreements />} />
          <Route path="property-agreements" element={<LandlordCapabilityRoute><LandlordAgreements /></LandlordCapabilityRoute>} />
          <Route path="my-payments" element={<Payments />} />
          <Route path="received-payments" element={<LandlordCapabilityRoute><PaymentsReceived /></LandlordCapabilityRoute>} />
          <Route path="income" element={<LandlordCapabilityRoute><IncomeReport /></LandlordCapabilityRoute>} />
          <Route path="messages" element={<ChatPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="disputes" element={<Disputes />} />
          <Route path="my-maintenance" element={<MaintenanceRequests />} />
          <Route path="property-maintenance" element={<LandlordCapabilityRoute><LandlordMaintenanceRequests /></LandlordCapabilityRoute>} />
          <Route path="fake-detector" element={<AIDetector />} />
          <Route path="host-detector" element={<LandlordCapabilityRoute><LandlordFakeDetector /></LandlordCapabilityRoute>} />
          <Route path="rent-estimator" element={<RentEstimator />} />
          <Route path="trust-scores" element={<TrustScores />} />
          <Route path="host-trust" element={<LandlordCapabilityRoute><LandlordTrustScores /></LandlordCapabilityRoute>} />
          <Route path="host-verification" element={<LandlordCapabilityRoute><LandlordVerification /></LandlordCapabilityRoute>} />
          <Route path="tenants" element={<LandlordCapabilityRoute><MyTenants /></LandlordCapabilityRoute>} />
          <Route path="boost" element={<LandlordCapabilityRoute><RentraBoost /></LandlordCapabilityRoute>} />
          <Route path="profile" element={<Profile />} />
          <Route path="host-profile" element={<LandlordCapabilityRoute><LandlordProfile /></LandlordCapabilityRoute>} />
          <Route path="my-reviews" element={<ReviewsAndRatings />} />
          <Route path="host-reviews" element={<LandlordCapabilityRoute><LandlordReviews /></LandlordCapabilityRoute>} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Keep old bookmarks working, but send them into the one dashboard. */}
        <Route path="/tenant/*" element={<LegacyWorkspaceRedirect workspace="tenant" />} />
        <Route path="/landlord/*" element={<LegacyWorkspaceRedirect workspace="landlord" />} />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="listings" element={<AdminResourcePage />} />
          <Route path="listings/:id" element={<ListingDetails />} />
          <Route path="approvals" element={<VerificationQueue kind="ALL" />} />
          <Route path="user-verification" element={<VerificationQueue kind="USER" />} />
          <Route path="property-verification" element={<VerificationQueue kind="PROPERTY" />} />
          <Route path="reported" element={<AdminResourcePage />} />
          <Route path="users" element={<AdminAllUsers />} />
          <Route path="users/:id" element={<AdminUserDetails />} />
          <Route path="users/tenants" element={<AdminAllUsers />} />
          <Route path="users/landlords" element={<AdminAllUsers />} />
          <Route path="users/verified" element={<AdminAllUsers />} />
          <Route path="users/banned" element={<AdminAllUsers />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="support" element={<SupportTickets />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="reviews" element={<AdminResourcePage />} />
          <Route path="properties" element={<AdminResourcePage />} />
          <Route path="hosts" element={<AdminResourcePage />} />
          <Route path="hotels" element={<AdminResourcePage />} />
          <Route path="hostels" element={<AdminResourcePage />} />
          <Route path="bookings" element={<AdminResourcePage />} />
          <Route path="rental-requests" element={<AdminResourcePage />} />
          <Route path="agreements" element={<AdminResourcePage />} />
          <Route path="payments" element={<AdminResourcePage />} />
          <Route path="reports" element={<AdminResourcePage />} />
          <Route path="verification" element={<VerificationQueue kind="ALL" />} />
          <Route path="audit" element={<AdminResourcePage />} />
          <Route path="disputes" element={<AdminAllDisputes />} />
          <Route path="disputes/open" element={<AdminAllDisputes />} />
          <Route path="disputes/resolved" element={<AdminAllDisputes />} />
          <Route path="analytics" element={<AdminPlatformAnalytics />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
