import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { LayoutDashboard, Home, Plus, Star, FileText, CreditCard, Scale, User, Heart, MessageCircle, CheckCircle, Eye, Users, TrendingUp, Bell, Settings, Bookmark, ClipboardList, CalendarDays, ShieldCheck } from 'lucide-react';

// Context
import { ThemeProvider } from './context/ThemeContext';
import { useTheme } from './context/useTheme';

// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import PasswordRecovery from './pages/auth/PasswordRecovery';
import VerifyEmail from './pages/auth/VerifyEmail';
import HomePage from './pages/home/HomePage';
import Contact from './pages/contact/Contact';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Shared
import SettingsPage from './pages/settings/SettingsPage';

// Tenant Pages
import TenantDashboard from './pages/tenant/TenantDashboard';
import BrowseListings from './pages/tenant/BrowseListings';
import ListingDetails from './pages/tenant/ListingDetails';
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
import LandlordDashboard from './pages/landlord/LandlordDashboard';
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
import ChatPage from './pages/messages/ChatPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProfile from './pages/admin/Profile';
import AdminAllUsers from './pages/admin/AllUsers';
import AdminAllDisputes from './pages/admin/AllDisputes';
import AdminPlatformAnalytics from './pages/admin/PlatformAnalytics';
import AdminMessages from './pages/admin/Messages';
import AdminResourcePage from './pages/admin/AdminResourcePage';
import VerificationQueue from './pages/admin/VerificationQueue';
import NotificationsPage from './pages/notifications/NotificationsPage';
import { useAuthStore } from './store/authStore';

function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-5 text-center text-[var(--text)]">
      <div className="max-w-md">
        <p className="text-sm font-semibold uppercase tracking-widest text-[var(--green-soft)]">404 · Page not found</p>
        <h1 className="mt-3 text-3xl font-semibold">We couldn't find that page.</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text2)]">The link may be outdated, or the address may have been typed incorrectly.</p>
        <Link to="/" className="mt-6 inline-flex rounded-xl bg-[var(--green)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--green-hover)]">Go to Rentra home</Link>
      </div>
    </main>
  );
}

// Nav configs
const tenantNavSections = [
  {
    title: 'MAIN',
    items: [
      { icon: <LayoutDashboard size={16} />, label: 'Dashboard', path: '/tenant' },
      { icon: <Home size={16} />, label: 'Browse Listings', path: '/tenant/listings' },
      { icon: <Plus size={16} />, label: 'Post a Property', path: '/tenant/post' },
      { icon: <Heart size={16} />, label: 'Saved Listings', path: '/tenant/saved' },
      { icon: <Bookmark size={16} />, label: 'Saved Searches', path: '/tenant/saved-searches' },
      { icon: <MessageCircle size={16} />, label: 'Messages', path: '/tenant/messages' },
      { icon: <Bell size={16} />, label: 'Notifications', path: '/tenant/notifications' },
    ],
  },
  {
    title: 'MY TENANCY',
    items: [
      { icon: <FileText size={16} />, label: 'My Agreements', path: '/tenant/agreement' },
      { icon: <ClipboardList size={16} />, label: 'Rental Requests', path: '/tenant/rental-requests' },
      { icon: <CalendarDays size={16} />, label: 'My Bookings', path: '/tenant/bookings' },
      { icon: <CreditCard size={16} />, label: 'Payments', path: '/tenant/payments' },
      { icon: <Scale size={16} />, label: 'Disputes', path: '/tenant/disputes' },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      { icon: <User size={16} />, label: 'Profile', path: '/tenant/profile' },
      { icon: <Star size={16} />, label: 'Trust Score', path: '/tenant/trust' },
      { icon: <Star size={16} />, label: 'My Reviews & Ratings', path: '/tenant/reviews' },
      { icon: <Settings size={16} />, label: 'Settings', path: '/tenant/settings' },
    ],
  },
];

const landlordNavSections = [
  {
    title: 'MAIN',
    items: [
      { icon: <LayoutDashboard size={16} />, label: 'Dashboard', path: '/landlord' },
      { icon: <Home size={16} />, label: 'My Properties', path: '/landlord/properties' },
      { icon: <Plus size={16} />, label: 'Post Property', path: '/landlord/post' },
      { icon: <CalendarDays size={16} />, label: 'Bookings', path: '/landlord/bookings' },
      { icon: <CalendarDays size={16} />, label: 'Availability', path: '/landlord/availability' },
      { icon: <MessageCircle size={16} />, label: 'Messages', path: '/landlord/messages' },
      { icon: <Bell size={16} />, label: 'Notifications', path: '/landlord/notifications' },
    ],
  },
  {
    title: 'TENANTS',
    items: [
      { icon: <Users size={16} />, label: 'My Tenants', path: '/landlord/tenants' },
      { icon: <CheckCircle size={16} />, label: 'Pending Applications', path: '/landlord/applications' },
      { icon: <FileText size={16} />, label: 'Agreements', path: '/landlord/agreements' },
    ],
  },
  {
    title: 'MONEY',
    items: [
      { icon: <CreditCard size={16} />, label: 'Payments Received', path: '/landlord/payments' },
      { icon: <TrendingUp size={16} />, label: 'Income Report', path: '/landlord/income' },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      { icon: <User size={16} />, label: 'Profile', path: '/landlord/profile' },
      { icon: <ShieldCheck size={16} />, label: 'Verification', path: '/landlord/verification' },
      { icon: <Eye size={16} />, label: 'Tenant Trust Scores', path: '/landlord/trust' },
      { icon: <Star size={16} />, label: 'Reviews', path: '/landlord/reviews' },
      { icon: <Settings size={16} />, label: 'Settings', path: '/landlord/settings' },
    ],
  },
];

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const { isDark } = useTheme();
  const initializeAuth = useAuthStore((state) => state.initialize);

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: isDark ? '#171717' : '#ffffff',
            color: isDark ? '#f0f0f0' : '#000000',
            border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.1)',
            fontSize: '13px'
          },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/listings" element={<BrowseListings />} />
        <Route path="/listings/:id" element={<ListingDetails />} />
        <Route path="/favorites" element={<SavedListings />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<PasswordRecovery />} />
        <Route path="/reset-password" element={<PasswordRecovery />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/help" element={<Contact />} />

        {/* Shared - Settings */}
        <Route path="/settings" element={
          <ProtectedRoute allowedRoles={['TENANT', 'LANDLORD', 'ADMIN']}>
            <SettingsPage />
          </ProtectedRoute>
        } />

        {/* Tenant Routes */}
        <Route path="/tenant" element={
          <ProtectedRoute allowedRoles={['TENANT']}>
            <DashboardLayout navSections={tenantNavSections} />
          </ProtectedRoute>
        }>
          <Route index element={<TenantDashboard />} />
          <Route path="listings" element={<BrowseListings />} />
          <Route path="listings/:id" element={<ListingDetails />} />
          <Route path="saved" element={<SavedListings />} />
          <Route path="saved-searches" element={<SavedSearches />} />
          <Route path="rental-requests" element={<TenantRentalRequests />} />
          <Route path="bookings" element={<TenantBookings />} />
          <Route path="messages" element={<ChatPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="post" element={<PostProperty />} />
          <Route path="detector" element={<AIDetector />} />
          <Route path="estimator" element={<RentEstimator />} />
          <Route path="trust" element={<TrustScores />} />
          <Route path="agreement" element={<Agreements />} />
          <Route path="payments" element={<Payments />} />
          <Route path="disputes" element={<Disputes />} />
          <Route path="maintenance" element={<MaintenanceRequests />} />
          <Route path="profile" element={<Profile />} />
          <Route path="reviews" element={<ReviewsAndRatings />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Landlord Routes */}
        <Route path="/landlord" element={
          <ProtectedRoute allowedRoles={['LANDLORD']}>
            <DashboardLayout navSections={landlordNavSections} />
          </ProtectedRoute>
        }>
          <Route index element={<LandlordDashboard />} />
          <Route path="properties" element={<MyProperties />} />
          <Route path="post" element={<LandlordPostProperty />} />
          <Route path="bookings" element={<LandlordBookings />} />
          <Route path="availability" element={<LandlordAvailability />} />
          <Route path="verification" element={<LandlordVerification />} />
          <Route path="messages" element={<ChatPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="tenants" element={<MyTenants />} />
          <Route path="applications" element={<PendingApplications />} />
          <Route path="agreements" element={<LandlordAgreements />} />
          <Route path="payments" element={<PaymentsReceived />} />
          <Route path="income" element={<IncomeReport />} />
          <Route path="estimator" element={<RentEstimator />} />
          <Route path="detector" element={<LandlordFakeDetector />} />
          <Route path="trust" element={<LandlordTrustScores />} />
          <Route path="maintenance" element={<LandlordMaintenanceRequests />} />
          <Route path="profile" element={<LandlordProfile />} />
          <Route path="reviews" element={<LandlordReviews />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="listings" element={<AdminResourcePage />} />
          <Route path="approvals" element={<VerificationQueue />} />
          <Route path="reported" element={<AdminResourcePage />} />
          <Route path="users" element={<AdminAllUsers />} />
          <Route path="users/tenants" element={<AdminAllUsers />} />
          <Route path="users/landlords" element={<AdminAllUsers />} />
          <Route path="users/verified" element={<AdminAllUsers />} />
          <Route path="users/banned" element={<AdminAllUsers />} />
          <Route path="messages" element={<AdminMessages />} />
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
          <Route path="verification" element={<VerificationQueue />} />
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
