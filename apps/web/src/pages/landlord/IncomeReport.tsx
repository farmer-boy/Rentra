import { useEffect, useMemo, useState } from 'react';
import Card from '../../components/ui/Card';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';

interface Agreement {
  id: string;
  landlordId: string;
  listingId: string;
}

interface Listing {
  id: string;
  title: string;
}

interface Payment {
  id: string;
  agreementId: string | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

const responseList = <T,>(value: unknown, label: string): T[] => {
  if (!Array.isArray(value)) throw new Error(`The server returned invalid ${label} data.`);
  return value as T[];
};

const errorMessage = (error: unknown) =>
  (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
    ?? (error as { message?: string })?.message
    ?? 'Income records could not be loaded. Please try again.';

const currencyTotals = (payments: Payment[]) => {
  const totals = new Map<string, number>();
  payments.forEach((payment) => totals.set(payment.currency, (totals.get(payment.currency) ?? 0) + payment.amount));
  return [...totals].map(([currency, amount]) => `${currency} ${amount.toLocaleString()}`).join(' · ') || '—';
};

const IncomeReport = () => {
  const user = useAuthStore((state) => state.user);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!user?.id) return () => { active = false; };

    Promise.all([api.get('/agreements'), api.get('/payments'), api.get('/listings/landlord/my-listings')])
      .then(([agreementResponse, paymentResponse, listingResponse]) => {
        const receivedAgreements = responseList<Agreement>(agreementResponse.data?.data, 'agreement')
          .filter((agreement) => agreement.landlordId === user.id);
        const receivedPayments = responseList<Payment>(paymentResponse.data?.data, 'payment');
        const receivedListings = responseList<Listing>(listingResponse.data?.data, 'property');
        const ownedAgreementIds = new Set(receivedAgreements.map((agreement) => agreement.id));
        if (active) {
          setError('');
          setAgreements(receivedAgreements);
          setListings(receivedListings);
          setPayments(receivedPayments.filter((payment) => payment.agreementId && ownedAgreementIds.has(payment.agreementId) && payment.status === 'PAID'));
        }
      })
      .catch((cause: unknown) => { if (active) setError(errorMessage(cause)); })
      .finally(() => { if (active) setLoadedUserId(user.id); });

    return () => { active = false; };
  }, [user?.id]);

  const { currentMonthPayments, monthlyRows, propertyRows } = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthKeys = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return { key: `${date.getFullYear()}-${date.getMonth()}`, date };
    });
    const listingById = new Map(listings.map((listing) => [listing.id, listing]));
    const agreementById = new Map(agreements.map((agreement) => [agreement.id, agreement]));
    const current = payments.filter((payment) => new Date(payment.createdAt) >= monthStart && new Date(payment.createdAt) <= now);
    const monthly = monthKeys.map(({ key, date }) => {
      const monthPayments = payments.filter((payment) => {
        const paymentDate = new Date(payment.createdAt);
        return `${paymentDate.getFullYear()}-${paymentDate.getMonth()}` === key;
      });
      return { label: date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }), payments: monthPayments };
    });
    const propertyGroups = new Map<string, { listingId: string; title: string; payments: Payment[] }>();
    payments.forEach((payment) => {
      const agreement = payment.agreementId ? agreementById.get(payment.agreementId) : undefined;
      if (!agreement) return;
      const listing = listingById.get(agreement.listingId);
      const key = agreement.listingId;
      const group = propertyGroups.get(key) ?? { listingId: key, title: listing?.title || 'Property details unavailable', payments: [] };
      group.payments.push(payment);
      propertyGroups.set(key, group);
    });
    return {
      currentMonthPayments: current,
      monthlyRows: monthly,
      propertyRows: [...propertyGroups.values()],
    };
  }, [agreements, listings, payments]);
  const loading = !!user?.id && loadedUserId !== user.id;
  const loadError = user?.id ? error : 'Your account details are unavailable. Sign in again to view income.';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Income Report</h1>
        <p className="text-gray-600 dark:text-gray-300">Rental income based on recorded paid transactions</p>
      </div>
      {!user?.id ? (
        <Card className="p-5"><p role="alert" className="text-sm text-red-700 dark:text-red-300">{loadError}</p></Card>
      ) : loading ? (
        <Card className="p-5"><p className="text-sm text-gray-600 dark:text-gray-300">Loading income records…</p></Card>
      ) : loadError ? (
        <Card className="p-5"><p role="alert" className="text-sm text-red-700 dark:text-red-300">{loadError}</p></Card>
      ) : payments.length === 0 ? (
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white">No recorded rental income</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">There are no paid payment transactions linked to your agreements. Expected rent and collection-rate data are not provided by the backend.</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="p-4"><p className="text-sm text-gray-600 dark:text-gray-400">Recorded this month</p><p className="mt-2 text-xl font-bold text-gray-900 dark:text-white">{currencyTotals(currentMonthPayments)}</p></Card>
            <Card className="p-4"><p className="text-sm text-gray-600 dark:text-gray-400">All-time recorded income</p><p className="mt-2 text-xl font-bold text-green-700 dark:text-green-400">{currencyTotals(payments)}</p></Card>
            <Card className="p-4"><p className="text-sm text-gray-600 dark:text-gray-400">Paid transactions</p><p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{payments.length}</p></Card>
          </div>

          <Card className="p-6">
            <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">Monthly recorded income</h2>
            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">Transactions are grouped by their recorded payment date. No expected-rent amounts are available.</p>
            <div className="space-y-3">
              {monthlyRows.map((row) => (
                <div key={row.label} className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3 last:border-0 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{row.label}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{row.payments.length ? currencyTotals(row.payments) : 'No paid transactions recorded'}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">Recorded income by property</h2>
            <div className="space-y-3">
              {propertyRows.map((property) => (
                <div key={property.listingId} className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3 last:border-0 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{property.title}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{currencyTotals(property.payments)}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default IncomeReport;
