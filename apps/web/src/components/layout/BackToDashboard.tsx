import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function BackToDashboard() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  if (pathname === '/' || pathname === '/dashboard' || pathname === '/admin') return null;

  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      aria-label="Go back to previous page"
      className="mb-4 inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-text transition-colors hover:border-primary hover:text-primary"
    >
      <ArrowLeft size={16} aria-hidden="true" />
      Back
    </button>
  );
}
