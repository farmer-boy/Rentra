import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function PublicListingsLayout() {
  return (
    <div className="flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-[var(--bg)]">
      <div className="sticky top-0 z-40 shrink-0">
        <Navbar />
      </div>
      <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-4 lg:p-6">
        <Outlet />
      </main>
    </div>
  );
}
