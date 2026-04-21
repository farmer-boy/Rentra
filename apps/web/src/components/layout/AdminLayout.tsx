import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import Navbar from './Navbar';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Navbar at Top */}
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
      
      {/* Sidebar and Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar - Compact on desktop, hidden on mobile */}
        <div className="hidden sm:flex sm:flex-shrink-0 sm:w-16 h-full z-40">
          <AdminSidebar onNavigate={() => setSidebarOpen(false)} isMobileOpen={false} />
        </div>

        {/* Mobile Sidebar Overlay - Full width when open */}
        {sidebarOpen && (
          <>
            <div className="sm:hidden flex-shrink-0 w-56 h-full z-40">
              <AdminSidebar onNavigate={() => setSidebarOpen(false)} isMobileOpen={true} />
            </div>
            <div 
              className="absolute inset-0 bg-black/40 sm:hidden z-30"
              onClick={() => setSidebarOpen(false)}
            />
          </>
        )}

        {/* Page Content - Smooth without jumping */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4" style={{ backgroundColor: 'var(--bg)' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
