import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AdminSidebar from './AdminSidebar';
import Navbar from './Navbar';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!sidebarOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [sidebarOpen]);

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg)', scrollbarGutter: 'stable' }}>
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <div className="z-40 hidden h-full shrink-0 md:flex" style={{ width: 'fit-content' }}>
          <AdminSidebar
            onNavigate={() => setSidebarOpen(false)}
            isMobileOpen={false}
            isDesktopView={true}
          />
        </div>

        {sidebarOpen && (
          <div id="mobile-navigation" className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              aria-label="Close navigation menu"
              className="absolute inset-0 bg-overlay/55"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 z-10 w-[min(14rem,85vw)] shadow-2xl">
              <AdminSidebar
                onNavigate={() => setSidebarOpen(false)}
                isMobileOpen={true}
                isDesktopView={false}
              />
            </aside>
          </div>
        )}

        <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-3 transition-all duration-300 sm:p-4 lg:p-6" style={{ backgroundColor: 'var(--bg)', scrollbarGutter: 'stable' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
