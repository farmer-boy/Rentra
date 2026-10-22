import { ArrowLeft } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function BackToDashboard() {
  const { pathname } = useLocation();
  const workspace = pathname.split('/').filter(Boolean)[0];

  if (!workspace || !['admin', 'dashboard'].includes(workspace)) return null;
  if (pathname === `/${workspace}`) return null;

  const label = workspace === 'admin'
    ? 'Back to Admin Dashboard'
    : 'Back to Dashboard';

  return (
    <Link
      to={`/${workspace}`}
      className="mb-4 inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-text transition-colors hover:border-primary hover:text-primary"
    >
      <ArrowLeft size={16} aria-hidden="true" />
      {label}
    </Link>
  );
}
