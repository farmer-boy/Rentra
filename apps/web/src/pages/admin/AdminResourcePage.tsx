import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { adminAPI } from '../../api/admin';
import { reportsAPI } from '../../api/reports';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';

type Row = Record<string, unknown>;

interface ResourceDefinition {
  title: string;
  endpoint: string;
  fixedType?: string;
  columns: Array<{ key: string; label: string }>;
}

interface ResourcePageResult {
  items: Row[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ListingStats {
  total?: number;
  published?: number;
  unpublished?: number;
  approved?: number;
  pendingReview?: number;
}

const definitions: Record<string, ResourceDefinition> = {
  listings: {
    title: 'Listings',
    endpoint: '/admin/listings',
    columns: [
      { key: 'title', label: 'Listing' },
      { key: 'landlord.fullName', label: 'Host' },
      { key: 'city', label: 'City' },
      { key: 'rent', label: 'Rent' },
      { key: 'status', label: 'Listing status' },
      { key: 'publicationStatus', label: 'Publication' },
      { key: 'property.verificationStatus', label: 'Property verification' },
    ],
  },
  properties: {
    title: 'Properties',
    endpoint: '/admin/properties',
    columns: [
      { key: 'title', label: 'Property' },
      { key: 'propertyType', label: 'Type' },
      { key: 'owner.fullName', label: 'Host' },
      { key: 'city', label: 'City' },
      { key: 'status', label: 'Status' },
      { key: 'verificationStatus', label: 'Verification' },
    ],
  },
  hosts: {
    title: 'Hosts',
    endpoint: '/admin/landlord-profiles',
    columns: [
      { key: 'user.fullName', label: 'Host' },
      { key: 'displayName', label: 'Profile name' },
      { key: 'user.emailVerifiedAt', label: 'Email verified' },
      { key: 'user.phoneVerifiedAt', label: 'Phone verified' },
      { key: 'user.isSuspended', label: 'Suspended' },
      { key: 'createdAt', label: 'Joined' },
    ],
  },
  hotels: {
    title: 'Hotels',
    endpoint: '/admin/properties',
    fixedType: 'HOTEL',
    columns: [
      { key: 'title', label: 'Hotel' },
      { key: 'owner.fullName', label: 'Host' },
      { key: 'city', label: 'City' },
      { key: 'hotel.starRating', label: 'Stars' },
      { key: 'status', label: 'Status' },
      { key: 'verificationStatus', label: 'Verification' },
    ],
  },
  hostels: {
    title: 'Hostels',
    endpoint: '/admin/properties',
    fixedType: 'HOSTEL',
    columns: [
      { key: 'title', label: 'Hostel' },
      { key: 'owner.fullName', label: 'Host' },
      { key: 'city', label: 'City' },
      { key: 'hostel.genderPolicy', label: 'Gender policy' },
      { key: 'status', label: 'Status' },
      { key: 'verificationStatus', label: 'Verification' },
    ],
  },
  bookings: {
    title: 'Bookings',
    endpoint: '/admin/bookings',
    columns: [
      { key: 'id', label: 'Booking' },
      { key: 'tenant.fullName', label: 'Tenant' },
      { key: 'property.title', label: 'Property' },
      { key: 'listing.title', label: 'Listing' },
      { key: 'status', label: 'Status' },
      { key: 'totalAmount', label: 'Amount' },
      { key: 'createdAt', label: 'Created' },
    ],
  },
  'rental-requests': {
    title: 'Rental Requests',
    endpoint: '/admin/rental-requests',
    columns: [
      { key: 'id', label: 'Request' },
      { key: 'tenant.fullName', label: 'Tenant' },
      { key: 'landlord.fullName', label: 'Host' },
      { key: 'listing.title', label: 'Listing' },
      { key: 'property.title', label: 'Property' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Created' },
    ],
  },
  agreements: {
    title: 'Agreements',
    endpoint: '/admin/agreements',
    columns: [
      { key: 'id', label: 'Agreement' },
      { key: 'tenant.fullName', label: 'Tenant' },
      { key: 'landlord.fullName', label: 'Host' },
      { key: 'listing.title', label: 'Listing' },
      { key: 'status', label: 'Status' },
      { key: 'monthlyRent', label: 'Monthly rent' },
      { key: 'endDate', label: 'End date' },
    ],
  },
  payments: {
    title: 'Payments',
    endpoint: '/admin/payments',
    columns: [
      { key: 'id', label: 'Payment' },
      { key: 'user.fullName', label: 'Tenant' },
      { key: 'status', label: 'Status' },
      { key: 'amount', label: 'Amount' },
      { key: 'currency', label: 'Currency' },
      { key: 'provider', label: 'Provider' },
      { key: 'createdAt', label: 'Created' },
    ],
  },
  reviews: {
    title: 'Reviews',
    endpoint: '/admin/reviews',
    columns: [
      { key: 'id', label: 'Review' },
      { key: 'reviewType', label: 'Type' },
      { key: 'user.fullName', label: 'Reviewer' },
      { key: 'property.title', label: 'Property' },
      { key: 'listing.title', label: 'Listing' },
      { key: 'rating', label: 'Rating' },
      { key: 'comment', label: 'Comment' },
      { key: 'createdAt', label: 'Created' },
    ],
  },
  reports: {
    title: 'Reports',
    endpoint: '/admin/reports',
    columns: [
      { key: 'id', label: 'Report' },
      { key: 'targetType', label: 'Target type' },
      { key: 'targetId', label: 'Target' },
      { key: 'reason', label: 'Reason' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Created' },
    ],
  },
  reported: {
    title: 'Reported items',
    endpoint: '/admin/reports',
    columns: [
      { key: 'id', label: 'Report' },
      { key: 'targetType', label: 'Target type' },
      { key: 'targetId', label: 'Target' },
      { key: 'reason', label: 'Reason' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Created' },
    ],
  },
  notifications: {
    title: 'Notifications',
    endpoint: '/admin/notifications',
    columns: [
      { key: 'title', label: 'Notification' },
      { key: 'type', label: 'Type' },
      { key: 'user.fullName', label: 'Recipient' },
      { key: 'message', label: 'Message' },
      { key: 'isRead', label: 'Read' },
      { key: 'createdAt', label: 'Created' },
    ],
  },
  verification: {
    title: 'Verification Queue',
    endpoint: '/verification/admin/submissions',
    columns: [
      { key: 'id', label: 'Submission' },
      { key: 'kind', label: 'Kind' },
      { key: 'status', label: 'Status' },
      { key: 'submittedAt', label: 'Submitted' },
    ],
  },
  audit: {
    title: 'Moderation Audit Log',
    endpoint: '/admin/audit-events',
    columns: [
      { key: 'action', label: 'Action' },
      { key: 'entityType', label: 'Entity' },
      { key: 'entityId', label: 'Entity ID' },
      { key: 'actorRole', label: 'Actor role' },
      { key: 'reason', label: 'Reason' },
      { key: 'createdAt', label: 'Created' },
    ],
  },
};

function getValue(row: Row, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    if (!value || typeof value !== 'object') return undefined;
    return (value as Record<string, unknown>)[key];
  }, row);
}

function renderValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string' && !Number.isNaN(Date.parse(value)) && value.includes('T')) {
    return new Date(value).toLocaleString();
  }
  if (typeof value === 'object') return '—';
  return String(value);
}

function toPageResult(data: unknown, page: number): ResourcePageResult {
  if (Array.isArray(data)) {
    const items = data as Row[];
    return { items, total: items.length, page, limit: items.length || 20, totalPages: 1 };
  }
  if (!data || typeof data !== 'object') {
    return { items: [], total: 0, page, limit: 20, totalPages: 0 };
  }
  const value = data as Partial<ResourcePageResult>;
  const items = Array.isArray(value.items) ? value.items : [];
  return {
    items,
    total: typeof value.total === 'number' ? value.total : items.length,
    page: typeof value.page === 'number' ? value.page : page,
    limit: typeof value.limit === 'number' ? value.limit : 20,
    totalPages: typeof value.totalPages === 'number' ? value.totalPages : 1,
  };
}

export default function AdminResourcePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resourceKey = location.pathname.split('/').filter(Boolean).at(-1) ?? '';
  const definition = definitions[resourceKey];
  const [result, setResult] = useState<ResourcePageResult | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const routeStatus = searchParams.get('status') ?? '';
  const routePublicationStatus = searchParams.get('publicationStatus') ?? '';
  const routeVerificationStatus = searchParams.get('verificationStatus') ?? '';
  const [status, setStatus] = useState(routeStatus);
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    status: routeStatus,
    publicationStatus: routePublicationStatus,
    verificationStatus: routeVerificationStatus,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [listingStats, setListingStats] = useState<ListingStats | null>(null);
  const [listingStatsLoading, setListingStatsLoading] = useState(false);
  const auditTableScrollRef = useRef<HTMLDivElement>(null);
  const auditDockScrollRef = useRef<HTMLDivElement>(null);
  const auditDockWidthRef = useRef<HTMLDivElement>(null);
  const [auditHasHorizontalOverflow, setAuditHasHorizontalOverflow] = useState(false);
  const [auditDockPosition, setAuditDockPosition] = useState({ left: 0, width: 0 });
  const endpoint = definition?.endpoint;
  const fixedType = definition?.fixedType;

  useEffect(() => {
    setStatus(routeStatus);
    setAppliedFilters({
      search: '',
      status: routeStatus,
      publicationStatus: routePublicationStatus,
      verificationStatus: routeVerificationStatus,
    });
    setPage(1);
  }, [routeStatus, routePublicationStatus, routeVerificationStatus]);

  useEffect(() => {
    if (resourceKey !== 'listings') return;
    let active = true;
    setListingStatsLoading(true);
    adminAPI.getDashboardStats().then((response) => {
      const outer = response as { data?: { listings?: ListingStats }; listings?: ListingStats };
      const payload = outer?.data ?? outer;
      if (active) setListingStats(payload.listings ?? null);
    }).catch(() => {
      if (active) setListingStats(null);
    }).finally(() => {
      if (active) setListingStatsLoading(false);
    });
    return () => { active = false; };
  }, [resourceKey]);

  const load = useCallback(async () => {
    if (!endpoint) return;
    setLoading(true);
    setError('');
    try {
      const response = await adminAPI.getResourcePage(endpoint, {
          page: resourceKey === 'audit' ? 1 : page,
          limit: resourceKey === 'audit' ? 100 : 20,
          ...(appliedFilters.search.trim() && { search: appliedFilters.search.trim() }),
          ...(appliedFilters.status && { status: appliedFilters.status }),
          ...(appliedFilters.publicationStatus && { publicationStatus: appliedFilters.publicationStatus }),
          ...(appliedFilters.verificationStatus && { verificationStatus: appliedFilters.verificationStatus }),
          ...(fixedType && { type: fixedType }),
      });
      setResult(toPageResult(response, page));
    } catch {
      setError(`${definition?.title ?? 'Records'} could not be loaded.`);
    } finally {
      setLoading(false);
    }
  }, [endpoint, fixedType, page, appliedFilters, definition?.title, resourceKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => result?.items ?? [], [result]);

  useEffect(() => {
    if (resourceKey !== 'audit') {
      setAuditHasHorizontalOverflow(false);
      return;
    }
    const tableScroll = auditTableScrollRef.current;
    const dockScroll = auditDockScrollRef.current;
    const dockWidth = auditDockWidthRef.current;
    if (!tableScroll) return;

    const updateDimensions = () => {
      const rect = tableScroll.getBoundingClientRect();
      const left = Math.max(0, rect.left);
      const right = Math.min(window.innerWidth, rect.right);
      if (dockWidth) dockWidth.style.width = `${tableScroll.scrollWidth}px`;
      setAuditDockPosition({ left, width: Math.max(0, right - left) });
      setAuditHasHorizontalOverflow(tableScroll.scrollWidth > tableScroll.clientWidth + 1);
      if (dockScroll) dockScroll.scrollLeft = tableScroll.scrollLeft;
    };
    const syncFromTable = () => {
      if (dockScroll && dockScroll.scrollLeft !== tableScroll.scrollLeft) {
        dockScroll.scrollLeft = tableScroll.scrollLeft;
      }
    };
    const syncFromDock = () => {
      if (dockScroll && tableScroll.scrollLeft !== dockScroll.scrollLeft) {
        tableScroll.scrollLeft = dockScroll.scrollLeft;
      }
    };
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(tableScroll);
    if (tableScroll.firstElementChild) observer.observe(tableScroll.firstElementChild);
    window.addEventListener('resize', updateDimensions);
    tableScroll.addEventListener('scroll', syncFromTable, { passive: true });
    dockScroll?.addEventListener('scroll', syncFromDock, { passive: true });
    updateDimensions();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateDimensions);
      tableScroll.removeEventListener('scroll', syncFromTable);
      dockScroll?.removeEventListener('scroll', syncFromDock);
    };
  }, [resourceKey, rows.length, loading, definition?.columns.length, auditHasHorizontalOverflow]);

  if (!definition) {
    return <p role="alert">Admin resource page was not found.</p>;
  }
  const showActions = resourceKey === 'listings' || resourceKey === 'reports' || resourceKey === 'reported';
  const activeListingCard = routePublicationStatus === 'PUBLISHED'
    ? 'published'
    : routePublicationStatus === 'UNPUBLISHED'
      ? 'unpublished'
      : routeVerificationStatus === 'APPROVED'
        ? 'verified'
        : routeVerificationStatus === 'PENDING'
          ? 'pending'
          : 'total';
  const listingCards = [
    { key: 'total', label: 'TOTAL LISTINGS', value: listingStats?.total, path: '/admin/listings' },
    { key: 'published', label: 'PUBLISHED', value: listingStats?.published, path: '/admin/listings?publicationStatus=PUBLISHED' },
    { key: 'unpublished', label: 'UNPUBLISHED', value: listingStats?.unpublished, path: '/admin/listings?publicationStatus=UNPUBLISHED' },
    { key: 'verified', label: 'VERIFIED', value: listingStats?.approved, path: '/admin/listings?verificationStatus=APPROVED' },
    { key: 'pending', label: 'PENDING REVIEW', value: listingStats?.pendingReview, path: '/admin/listings?verificationStatus=PENDING' },
  ];

  const runAction = async (row: Row, action: string) => {
    const id = typeof row.id === 'string' ? row.id : '';
    if (!id) return;
    const reason = window.prompt('Enter the reason for this audited moderation action:');
    if (!reason?.trim()) return;
    try {
      if (action === 'unpublish-listing') {
        await adminAPI.flagListing(id, reason);
      } else if (action === 'resolve-report') {
        const violationConfirmed = window.confirm('Did the investigation confirm a policy violation?');
        await reportsAPI.adminResolve(id, { resolutionNote: reason, violationConfirmed });
      } else if (action === 'reject-report') {
        await reportsAPI.adminModerateStatus(id, {
          status: 'REJECTED',
          resolutionNote: reason,
          violationConfirmed: false,
        });
      } else if (action === 'remove-reported-listing') {
        await reportsAPI.adminRemoveListing(id, reason);
      } else if (action === 'suspend-reported-user') {
        await reportsAPI.adminSuspendUser(id, reason);
      }
      await load();
    } catch {
      setError('Moderation action failed. Confirm the record state and try again.');
    }
  };

  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 ">{definition.title}</h1>
        <p className="mt-1 text-sm text-gray-600 ">
          Read-only administration view. Moderation and financial state changes remain in their audited workflows.
        </p>
      </header>

      {resourceKey === 'audit' && auditHasHorizontalOverflow && auditDockPosition.width > 0 && createPortal(
        <div
          ref={auditDockScrollRef}
          role="region"
          aria-label="Audit log horizontal scroll control"
          tabIndex={0}
          className="audit-table-dock h-5 overflow-x-scroll border border-border bg-surface shadow-md"
          style={{ left: auditDockPosition.left, width: auditDockPosition.width }}
        >
          <div ref={auditDockWidthRef} className="h-px" />
        </div>,
        document.body,
      )}

      {resourceKey === 'listings' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {listingCards.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => navigate(item.path)}
              aria-pressed={activeListingCard === item.key}
              className={`rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${activeListingCard === item.key ? 'ring-2 ring-primary/40' : ''}`}
            >
              <StatCard label={item.label} value={listingStatsLoading ? 'Loading...' : item.value ?? '—'} />
            </button>
          ))}
        </div>
      )}

      <Card className="p-4">
        <form
          className="flex flex-col sm:flex-row gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setAppliedFilters({ search, status, publicationStatus: routePublicationStatus, verificationStatus: routeVerificationStatus });
          }}
        >
          <label className="relative flex-1">
            <span className="sr-only">Search records</span>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full rounded-lg border border-gray-300  bg-surface  py-2 pl-9 pr-3 text-sm text-gray-900 "
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${definition.title.toLowerCase()}...`}
            />
          </label>
          <input
            className="rounded-lg border border-gray-300  bg-surface  px-3 py-2 text-sm text-gray-900 "
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            placeholder="Exact status filter"
            aria-label="Exact status filter"
          />
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-primary-contrast" type="submit">
            Search
          </button>
        </form>
      </Card>

      <Card className="p-0">
        {error && <p role="alert" className="p-4 text-sm text-red-600 ">{error}</p>}
        <div
          ref={resourceKey === 'audit' ? auditTableScrollRef : undefined}
          className={resourceKey === 'audit' ? 'audit-table-scroll overflow-x-auto' : 'overflow-x-auto'}
        >
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-gray-200 ">
                {definition.columns.map((column) => (
                  <th key={column.key} className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    {column.label}
                  </th>
                ))}
                {showActions && <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Audited actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="p-6 text-center text-sm text-gray-500" colSpan={definition.columns.length + Number(showActions)}>Loading records...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td className="p-6 text-center text-sm text-gray-500" colSpan={definition.columns.length + Number(showActions)}>No records found.</td></tr>
              ) : rows.map((row, index) => {
                const listingId = resourceKey === 'listings' && typeof row.id === 'string' ? row.id : '';
                return (
                <tr
                  key={String(row.id ?? index)}
                  className={`border-b border-gray-100 ${listingId ? 'cursor-pointer transition-colors hover:bg-primary/5 focus:bg-primary/5' : ''}`}
                  onClick={listingId ? () => navigate(`/admin/listings/${encodeURIComponent(listingId)}`) : undefined}
                  onKeyDown={listingId ? (event) => {
                    if (event.target !== event.currentTarget) return;
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigate(`/admin/listings/${encodeURIComponent(listingId)}`);
                    }
                  } : undefined}
                  tabIndex={listingId ? 0 : undefined}
                  role={listingId ? 'link' : undefined}
                  aria-label={listingId ? `Open listing ${String(row.title ?? '')}` : undefined}
                >
                  {definition.columns.map((column) => (
                    <td
                      key={column.key}
                      title={renderValue(getValue(row, column.key))}
                      className="max-w-xs truncate px-4 py-3 text-sm text-gray-800"
                    >
                      {renderValue(getValue(row, column.key))}
                    </td>
                  ))}
                  {showActions && (
                    <td className="px-4 py-3">
                      {resourceKey === 'listings' && row.publicationStatus !== 'UNPUBLISHED' && row.status !== 'REMOVED' && (
                        <button type="button" onClick={(event) => { event.stopPropagation(); void runAction(row, 'unpublish-listing'); }} className="mr-2 rounded border border-amber-500 px-2 py-1 text-xs text-amber-700 ">
                          Unpublish
                        </button>
                      )}
                      {(resourceKey === 'reports' || resourceKey === 'reported') && ['OPEN', 'INVESTIGATING'].includes(String(row.status)) && (
                        <>
                          <button type="button" onClick={() => void runAction(row, 'resolve-report')} className="mr-2 rounded border border-green-600 px-2 py-1 text-xs text-green-700 ">Resolve</button>
                          <button type="button" onClick={() => void runAction(row, 'reject-report')} className="rounded border border-gray-400 px-2 py-1 text-xs">Reject</button>
                        </>
                      )}
                      {(resourceKey === 'reports' || resourceKey === 'reported') && row.status === 'RESOLVED' && row.violationConfirmed === true && (
                        <>
                          {row.targetType === 'USER' && <button type="button" onClick={() => void runAction(row, 'suspend-reported-user')} className="mr-2 rounded border border-red-600 px-2 py-1 text-xs text-red-700 ">Suspend user</button>}
                          {['LISTING', 'PROPERTY'].includes(String(row.targetType)) && <button type="button" onClick={() => void runAction(row, 'remove-reported-listing')} className="rounded border border-red-600 px-2 py-1 text-xs text-red-700 ">Remove listing</button>}
                        </>
                      )}
                    </td>
                  )}
                </tr>
              );})}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-gray-200  px-4 py-3 text-sm text-gray-600 ">
          <span>{resourceKey === 'audit' ? `Showing ${rows.length} latest of ${result?.total ?? 0} records` : `${result?.total ?? 0} records`}</span>
          {resourceKey !== 'audit' && result && result.totalPages > 1 && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded border border-gray-300  px-3 py-1 disabled:opacity-40"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </button>
              <span>Page {result.page} of {result.totalPages}</span>
              <button
                type="button"
                className="rounded border border-gray-300  px-3 py-1 disabled:opacity-40"
                disabled={page >= result.totalPages || loading}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </Card>
    </section>
  );
}
