import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LayoutDashboard, Home, Plus, Lightbulb, Star, FileText, CreditCard, Scale, User, Heart, Wrench, MessageCircle, CheckCircle, AlertTriangle, Eye } from 'lucide-react';

// Context
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
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
import SavedListings from './pages/tenant/SavedListings';
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
import ChatPage from './pages/messages/ChatPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProfile from './pages/admin/Profile';
import AdminListings from './pages/admin/AllListings';
import AdminFakeDetectorQueue from './pages/admin/FakeDetectorQueue';
import AdminAllUsers from './pages/admin/AllUsers';
import AdminAllDisputes from './pages/admin/AllDisputes';
import AdminPlatformAnalytics from './pages/admin/PlatformAnalytics';
import AdminMessages from './pages/admin/Messages';

// Nav configs
const tenantNavSections = [
  {
    title: 'MAIN',
    items: [
      { icon: <LayoutDashboard size={16} />, label: 'Dashboard', path: '/tenant' },
      { icon: <Home size={16} />, label: 'Browse Listings', path: '/tenant/listings' },
      { icon: <Heart size={16} />, label: 'Saved Listings', path: '/tenant/saved' },
      { icon: <MessageCircle size={16} />, label: 'Messages', path: '/tenant/messages' },
    ],
  },
  {
    title: 'MY TENANCY',
    items: [
      { icon: <FileText size={16} />, label: 'My Agreements', path: '/tenant/agreement' },
      { icon: <CreditCard size={16} />, label: 'Payments', path: '/tenant/payments' },
      { icon: <Scale size={16} />, label: 'Active Disputes', path: '/tenant/disputes', badge: 2 },
      { icon: <Wrench size={16} />, label: 'Maintenance Requests', path: '/tenant/maintenance' },
    ],
  },
  {
    title: 'AI TOOLS',
    items: [
      { icon: <Lightbulb size={16} />, label: 'Rent Estimator', path: '/tenant/estimator' },
      { icon: <Star size={16} />, label: 'Trust Scores', path: '/tenant/trust' },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      { icon: <User size={16} />, label: 'Profile', path: '/tenant/profile' },
      { icon: <MessageCircle size={16} />, label: 'My Reviews & Ratings', path: '/tenant/reviews' },
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
      { icon: <MessageCircle size={16} />, label: 'Messages', path: '/landlord/messages' },
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
      { icon: <Lightbulb size={16} />, label: 'Rent Estimator', path: '/landlord/estimator' },
    ],
  },
  {
    title: 'AI TOOLS',
    items: [
      { icon: <AlertTriangle size={16} />, label: 'Fake Detector', path: '/landlord/detector' },
      { icon: <Eye size={16} />, label: 'Tenant Trust Scores', path: '/landlord/trust' },
    ],
  },
  {
    title: 'MAINTENANCE',
    items: [
      { icon: <Wrench size={16} />, label: 'Maintenance Requests', path: '/landlord/maintenance', badge: 3 },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      { icon: <User size={16} />, label: 'Profile', path: '/landlord/profile' },
      { icon: <MessageCircle size={16} />, label: 'My Reviews', path: '/landlord/reviews' },
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
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/contact" element={<Contact />} />

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
          <Route path="saved" element={<SavedListings />} />
          <Route path="messages" element={<ChatPage />} />
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
          <Route path="messages" element={<ChatPage />} />
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
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="listings" element={<AdminListings />} />
          <Route path="detector-queue" element={<AdminFakeDetectorQueue />} />
          <Route path="approvals" element={<AdminListings />} />
          <Route path="reported" element={<AdminListings />} />
          <Route path="users" element={<AdminAllUsers />} />
          <Route path="users/tenants" element={<AdminAllUsers />} />
          <Route path="users/landlords" element={<AdminAllUsers />} />
          <Route path="users/verified" element={<AdminAllUsers />} />
          <Route path="users/banned" element={<AdminAllUsers />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="payments" element={<AdminListings />} />
          <Route path="revenue" element={<AdminListings />} />
          <Route path="withdrawals" element={<AdminListings />} />
          <Route path="transactions" element={<AdminListings />} />
          <Route path="disputes" element={<AdminAllDisputes />} />
          <Route path="disputes/open" element={<AdminAllDisputes />} />
          <Route path="disputes/resolved" element={<AdminAllDisputes />} />
          <Route path="ai-models" element={<AdminPlatformAnalytics />} />
          <Route path="ai-detector" element={<AdminFakeDetectorQueue />} />
          <Route path="analytics" element={<AdminPlatformAnalytics />} />
          <Route path="training-logs" element={<AdminPlatformAnalytics />} />
          <Route path="settings" element={<AdminListings />} />
          <Route path="gateways" element={<AdminListings />} />
          <Route path="logs" element={<AdminListings />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
