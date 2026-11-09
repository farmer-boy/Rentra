export type Workspace = 'tenant' | 'landlord';

const landlordRoutes = new Set([
  'properties', 'post-property', 'received-requests', 'property-bookings',
  'availability', 'property-agreements', 'received-payments', 'income',
  'property-maintenance', 'host-detector', 'host-trust', 'host-verification',
  'tenants', 'boost', 'host-profile', 'host-reviews',
]);

const tenantRoutes = new Set([
  'listings', 'saved', 'saved-searches', 'enable-hosting', 'my-requests',
  'my-bookings', 'my-agreements', 'rental-history', 'my-payments', 'disputes',
  'my-maintenance', 'fake-detector', 'trust-scores', 'rent-estimator',
  'my-reviews', 'profile',
]);

const workspaceKey = (userId: string) => `rentra.workspace.${userId}`;

export function getSavedWorkspace(userId?: string): Workspace {
  if (!userId || typeof window === 'undefined') return 'tenant';
  return window.localStorage.getItem(workspaceKey(userId)) === 'landlord'
    ? 'landlord'
    : 'tenant';
}

export function saveWorkspace(userId: string | undefined, workspace: Workspace) {
  if (!userId || typeof window === 'undefined') return;
  window.localStorage.setItem(workspaceKey(userId), workspace);
}

export function getWorkspaceFromPath(
  pathname: string,
  hasLandlordAccess: boolean,
): Workspace | null {
  const dashboardPrefix = '/dashboard/';
  if (pathname === '/dashboard') return 'tenant';
  if (!pathname.startsWith(dashboardPrefix)) return null;

  const route = pathname.slice(dashboardPrefix.length).split('/')[0];
  if (route === 'landlord') return hasLandlordAccess ? 'landlord' : 'tenant';
  if (landlordRoutes.has(route)) return hasLandlordAccess ? 'landlord' : 'tenant';
  if (tenantRoutes.has(route)) return 'tenant';
  return null;
}

