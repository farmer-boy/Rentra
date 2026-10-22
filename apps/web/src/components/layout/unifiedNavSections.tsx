import {
  Bell, Bookmark, CalendarDays, ClipboardList, CreditCard, Eye, FileText,
  Heart, Home, LayoutDashboard, LifeBuoy, MessageCircle, Plus, Scale, Settings,
  ShieldCheck, Star, TrendingUp, User, Users, Zap,
} from 'lucide-react';
import type { NavSection } from './Sidebar';

export function getUnifiedNavSections(hasLandlordAccess: boolean, isAdmin = false): NavSection[] {
  return [
    {
      title: 'DASHBOARD',
      items: [{ icon: <LayoutDashboard size={16} />, label: 'Overview', path: '/dashboard' }],
    },
    {
      title: 'RENT A HOME',
      items: [
        {
          icon: <Home size={16} />, label: 'Find a home', children: [
            { icon: <Home size={16} />, label: 'Browse properties', path: '/dashboard/listings' },
            { icon: <Heart size={16} />, label: 'Saved properties', path: '/dashboard/saved' },
            { icon: <Bookmark size={16} />, label: 'Saved searches', path: '/dashboard/saved-searches' },
          ],
        },
        {
          icon: <ClipboardList size={16} />, label: 'My rentals', children: [
            { icon: <ClipboardList size={16} />, label: 'Requests I sent', path: '/dashboard/my-requests' },
            { icon: <CalendarDays size={16} />, label: 'My bookings', path: '/dashboard/my-bookings' },
            { icon: <FileText size={16} />, label: 'My agreements', path: '/dashboard/my-agreements' },
            { icon: <CreditCard size={16} />, label: 'My payments', path: '/dashboard/my-payments' },
            { icon: <Home size={16} />, label: 'Rental history', path: '/dashboard/rental-history' },
            { icon: <Scale size={16} />, label: 'Disputes', path: '/dashboard/disputes' },
            { icon: <Settings size={16} />, label: 'Maintenance requests', path: '/dashboard/my-maintenance' },
          ],
        },
      ],
    },
    {
      title: 'HOST A PROPERTY',
      items: hasLandlordAccess
        ? [
            {
              icon: <Home size={16} />, label: 'Properties', children: [
                { icon: <Home size={16} />, label: 'My properties', path: '/dashboard/properties' },
                ...(!isAdmin ? [{ icon: <Plus size={16} />, label: 'Post a property', path: '/dashboard/post-property' }] : []),
                { icon: <Zap size={16} />, label: 'Rentra Boost', path: '/dashboard/boost' },
              ],
            },
            {
              icon: <CalendarDays size={16} />, label: 'Property operations', children: [
                { icon: <ClipboardList size={16} />, label: 'Requests received', path: '/dashboard/received-requests' },
                { icon: <CalendarDays size={16} />, label: 'Bookings', path: '/dashboard/property-bookings' },
                { icon: <CalendarDays size={16} />, label: 'Availability', path: '/dashboard/availability' },
                { icon: <Users size={16} />, label: 'My tenants', path: '/dashboard/tenants' },
                { icon: <FileText size={16} />, label: 'Agreements', path: '/dashboard/property-agreements' },
                { icon: <Settings size={16} />, label: 'Maintenance', path: '/dashboard/property-maintenance' },
              ],
            },
            {
              icon: <CreditCard size={16} />, label: 'Host finances', children: [
                { icon: <CreditCard size={16} />, label: 'Payments received', path: '/dashboard/received-payments' },
                { icon: <TrendingUp size={16} />, label: 'Income report', path: '/dashboard/income' },
              ],
            },
            {
              icon: <ShieldCheck size={16} />, label: 'Host tools', children: [
                { icon: <ShieldCheck size={16} />, label: 'Host verification', path: '/dashboard/host-verification' },
                { icon: <Eye size={16} />, label: 'Listing detector', path: '/dashboard/host-detector' },
                { icon: <TrendingUp size={16} />, label: 'Tenant trust scores', path: '/dashboard/host-trust' },
                { icon: <Star size={16} />, label: 'Property reviews', path: '/dashboard/host-reviews' },
              ],
            },
          ]
        : isAdmin ? [] : [{ icon: <Plus size={16} />, label: 'Post a property', path: '/dashboard/enable-hosting' }],
    },
    {
      title: 'COMMUNICATION & ACCOUNT',
      items: [
        { icon: <MessageCircle size={16} />, label: 'Messages', path: '/dashboard/messages' },
        { icon: <LifeBuoy size={16} />, label: 'Help & Support', path: '/dashboard/support' },
        { icon: <Bell size={16} />, label: 'Notifications', path: '/dashboard/notifications' },
        {
          icon: <User size={16} />, label: 'My account', children: [
            { icon: <User size={16} />, label: 'Profile', path: '/dashboard/profile' },
            { icon: <ShieldCheck size={16} />, label: 'Trust score', path: '/dashboard/trust-scores' },
            { icon: <Star size={16} />, label: 'My reviews', path: '/dashboard/my-reviews' },
            { icon: <TrendingUp size={16} />, label: 'Rent estimator', path: '/dashboard/rent-estimator' },
            { icon: <Eye size={16} />, label: 'Fake listing detector', path: '/dashboard/fake-detector' },
            ...(hasLandlordAccess ? [{ icon: <Settings size={16} />, label: 'Host profile', path: '/dashboard/host-profile' }] : []),
            { icon: <Settings size={16} />, label: 'Settings', path: '/dashboard/settings' },
          ],
        },
      ],
    },
  ];
}
