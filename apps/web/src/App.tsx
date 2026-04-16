import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LayoutDashboard, Home, Plus, Bot, Lightbulb, Star, FileText, CreditCard, Scale, Shield, User } from 'lucide-react';

// Context
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import HomePage from './pages/home/HomePage';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Shared
import SettingsPage from './pages/settings/SettingsPage';

// Tenant Pages
import TenantDashboard from './pages/tenant/TenantDashboard';
import BrowseListings from './pages/tenant/BrowseListings';
import AIDetector from './pages/tenant/AIDetector';
import RentEstimator from './pages/tenant/RentEstimator';
import TrustScores from './pages/tenant/TrustScores';
import Agreements from './pages/tenant/Agreements';
import Payments from './pages/tenant/Payments';
import Disputes from './pages/tenant/Disputes';
import Profile from './pages/tenant/Profile';
import PostProperty from './pages/tenant/PostProperty';

// Landlord Pages
import LandlordDashboard from './pages/landlord/LandlordDashboard';
import LandlordProfile from './pages/landlord/Profile';
import LandlordPostProperty from './pages/landlord/PostProperty';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProfile from './pages/admin/Profile';

// Nav configs
const tenantNavSections = [
  {
    title: 'MAIN',
    items: [
      { icon: <LayoutDashboard size={16} />, label: 'Dashboard', path: '/tenant' },
      { icon: <Home size={16} />, label: 'Browse Listings', path: '/tenant/listings' },
      { icon: <Plus size={16} />, label: 'Post Property', path: '/tenant/post' },
    ],
  },
  {
    title: 'AI FEATURES',
    items: [
      { icon: <Bot size={16} />, label: 'Fake Detector', path: '/tenant/detector' },
      { icon: <Lightbulb size={16} />, label: 'Rent Estimator', path: '/tenant/estimator' },
      { icon: <Star size={16} />, label: 'Trust Scores', path: '/tenant/trust' },
    ],
  },
  {
    title: 'TENANCY',
    items: [
      { icon: <FileText size={16} />, label: 'Agreements', path: '/tenant/agreement' },
      { icon: <CreditCard size={16} />, label: 'Payments', path: '/tenant/payments' },
      { icon: <Scale size={16} />, label: 'Disputes', path: '/tenant/disputes', badge: 2 },
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
    ],
  },
  {
    title: 'AI FEATURES',
    items: [
      { icon: <Bot size={16} />, label: 'AI Detector', path: '/landlord/detector' },
      { icon: <Star size={16} />, label: 'Trust Scores', path: '/landlord/trust' },
    ],
  },
  {
    title: 'TENANCY',
    items: [
      { icon: <FileText size={16} />, label: 'Agreements', path: '/landlord/agreements' },
      { icon: <CreditCard size={16} />, label: 'Payments', path: '/landlord/payments' },
      { icon: <Scale size={16} />, label: 'Disputes', path: '/landlord/disputes' },
    ],
  },
];

const adminNavSections = [
  {
    title: 'MAIN',
    items: [
      { icon: <LayoutDashboard size={16} />, label: 'Dashboard', path: '/admin' },
      { icon: <Shield size={16} />, label: 'Moderation', path: '/admin/moderation' },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { icon: <User size={16} />, label: 'Users', path: '/admin/users' },
      { icon: <Home size={16} />, label: 'All Listings', path: '/admin/listings' },
      { icon: <Scale size={16} />, label: 'Disputes', path: '/admin/disputes' },
      { icon: <Star size={16} />, label: 'Trust Scores', path: '/admin/trust' },
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
          <Route path="post" element={<PostProperty />} />
          <Route path="detector" element={<AIDetector />} />
          <Route path="estimator" element={<RentEstimator />} />
          <Route path="trust" element={<TrustScores />} />
          <Route path="agreement" element={<Agreements />} />
          <Route path="payments" element={<Payments />} />
          <Route path="disputes" element={<Disputes />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Landlord Routes */}
        <Route path="/landlord" element={
          <ProtectedRoute allowedRoles={['LANDLORD']}>
            <DashboardLayout navSections={landlordNavSections} />
          </ProtectedRoute>
        }>
          <Route index element={<LandlordDashboard />} />
          <Route path="post" element={<LandlordPostProperty />} />
          <Route path="profile" element={<LandlordProfile />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DashboardLayout navSections={adminNavSections} />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
