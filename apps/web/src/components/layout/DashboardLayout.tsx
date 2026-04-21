import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true); // Desktop expand/collapse

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Navbar at Top */}
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
      
      {/* Sidebar and Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Wrapper - Fixed width with smooth transition */}
        <div className={`
          hidden md:flex flex-shrink-0 transition-all duration-300 ease-in-out
          ${sidebarExpanded ? 'w-56' : 'w-16'}
        `}>
          <Sidebar 
            navSections={navSections} 
            onNavigate={() => setSidebarOpen(false)}
            isExpanded={sidebarExpanded}
            setIsExpanded={setSidebarExpanded}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <>
            <div className="md:hidden flex-shrink-0 w-56">
              <Sidebar 
                navSections={navSections} 
                onNavigate={() => setSidebarOpen(false)}
                isExpanded={true}
                setIsExpanded={() => {}}
              />
            </div>
            <div 
              className="absolute inset-0 bg-black/40 z-30 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          </>
        )}
        
        {/* Page Content - Smooth expansion without jumping */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 transition-all duration-300" style={{ backgroundColor: 'var(--bg)' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
