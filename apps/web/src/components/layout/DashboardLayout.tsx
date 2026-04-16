import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface DashboardLayoutProps {
  navSections: NavSection[];
}

export default function DashboardLayout({ navSections }: DashboardLayoutProps) {
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className={`flex h-screen ${isDark ? 'bg-[#0f0f0f]' : 'bg-white'} overflow-hidden`}>
      <Sidebar navSections={navSections} role={user?.role || ''} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        {/* Page Content */}
        <div className={`flex-1 overflow-y-auto p-6 ${isDark ? 'bg-[#0f0f0f]' : 'bg-white'}`}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
