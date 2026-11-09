import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar, { type NavSection } from './Sidebar';
import Navbar from './Navbar';
import BackToDashboard from './BackToDashboard';
import { useAuthStore } from '../../store/authStore';
import { getUnifiedNavSections } from './unifiedNavSections';
import { getSavedWorkspace, getWorkspaceFromPath, saveWorkspace } from './workspace';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true); // Desktop expand/collapse
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const roles = user?.roles ?? (user?.role ? [user.role] : []);
  const hasLandlordAccess = roles.includes('LANDLORD');
  const pathWorkspace = getWorkspaceFromPath(location.pathname, hasLandlordAccess);
  const activeWorkspace = hasLandlordAccess
    ? pathWorkspace ?? getSavedWorkspace(user?.id)
    : 'tenant';
  const navSections: NavSection[] = getUnifiedNavSections(
    hasLandlordAccess,
    roles.includes('ADMIN'),
    activeWorkspace,
  );

  useEffect(() => {
    if (pathWorkspace && user?.id) saveWorkspace(user.id, pathWorkspace);
  }, [pathWorkspace, user?.id]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [sidebarOpen]);

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <div className={`
          hidden shrink-0 transition-[width] duration-300 ease-in-out md:flex
          ${sidebarExpanded ? 'w-56' : 'w-16'}
        `}>
          <Sidebar
            navSections={navSections}
            onNavigate={() => setSidebarOpen(false)}
            isExpanded={sidebarExpanded}
            setIsExpanded={setSidebarExpanded}
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
            <aside className="absolute inset-y-0 left-0 z-10 w-[min(18rem,85vw)] shadow-2xl">
              <Sidebar
                navSections={navSections}
                onNavigate={() => setSidebarOpen(false)}
                isExpanded={true}
              />
            </aside>
          </div>
        )}

        <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-3 transition-all duration-300 sm:p-4 lg:p-6" style={{ backgroundColor: 'var(--bg)' }}>
          <BackToDashboard />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
