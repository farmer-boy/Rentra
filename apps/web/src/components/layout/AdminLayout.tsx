import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import Navbar from './Navbar';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg)', scrollbarGutter: 'stable' }}>
      {/* Navbar at Top */}
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
      
      {/* Sidebar and Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar - Desktop View (Always Expanded on iPad+) */}
        <div className="hidden md:flex md:flex-shrink-0 h-full z-40" style={{ width: 'fit-content' }}>
          <AdminSidebar 
            onNavigate={() => setSidebarOpen(false)} 
            isMobileOpen={false}
            isDesktopView={true}
          />
        </div>

        {/* Mobile Sidebar Overlay - Full width when open */}
        {sidebarOpen && (
          <>
            <div className="md:hidden flex-shrink-0 w-56 h-full z-40">
              <AdminSidebar 
                onNavigate={() => setSidebarOpen(false)} 
                isMobileOpen={true}
                isDesktopView={false}
              />
            </div>
            <div 
              className="absolute inset-0 bg-black/40 md:hidden z-30"
              onClick={() => setSidebarOpen(false)}
            />
          </>
        )}

        {/* Page Content - Smooth without jumping */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 transition-all duration-300" style={{ backgroundColor: 'var(--bg)', scrollbarGutter: 'stable' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
