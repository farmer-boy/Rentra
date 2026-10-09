import { useEffect, useState } from 'react';
import { AlertCircle, Check, Clock, Home } from 'lucide-react';
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
  tenantId: string;
  tenant?: { fullName?: string; email?: string };
  amount: number;
  currency: string;
  method: string;
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
    ?? 'Payment records could not be loaded. Please try again.';

const currencyTotals = (payments: Payment[]) => {
  const totals = new Map<string, number>();
  payments.forEach((payment) => totals.set(payment.currency, (totals.get(payment.currency) ?? 0) + payment.amount));
  return [...totals].map(([currency, amount]) => `${currency} ${amount.toLocaleString()}`).join(' · ') || '—';
};

const statusStyle = (status: string) => status === 'PAID'
  ? 'bg-green-100 text-green-800'
  : status === 'PENDING' || status === 'AUTHORIZED'
    ? 'bg-amber-100 text-amber-800'
    : 'bg-gray-100 text-gray-700';

const PaymentsReceived = () => {
  const user = useAuthStore((state) => state.user);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!user?.id) return () => { active = false; };

    Promise.all([api.get('/payments'), api.get('/agreements'), api.get('/listings/landlord/my-listings')])
      .then(([paymentResponse, agreementResponse, listingResponse]) => {
        const receivedPayments = responseList<Payment>(paymentResponse.data?.data, 'payment');
        const receivedAgreements = responseList<Agreement>(agreementResponse.data?.data, 'agreement')
          .filter((agreement) => agreement.landlordId === user.id);
        const receivedListings = responseList<Listing>(listingResponse.data?.data, 'property');
        const ownedAgreementIds = new Set(receivedAgreements.map((agreement) => agreement.id));
        if (active) {
          setError('');
          setAgreements(receivedAgreements);
          setListings(receivedListings);
          setPayments(receivedPayments.filter((payment) => payment.agreementId && ownedAgreementIds.has(payment.agreementId)));
        }
      })
      .catch((cause: unknown) => { if (active) setError(errorMessage(cause)); })
      .finally(() => { if (active) setLoadedUserId(user.id); });

    return () => { active = false; };
  }, [user?.id]);

  const agreementById = new Map(agreements.map((agreement) => [agreement.id, agreement]));
  const listingNames = new Map(listings.map((listing) => [listing.id, listing.title]));
  const paidPayments = payments.filter((payment) => payment.status === 'PAID');
  const loading = !!user?.id && loadedUserId !== user.id;
  const loadError = user?.id ? error : 'Your account details are unavailable. Sign in again to view payments.';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Payments Received</h1>
        <p className="text-gray-600 dark:text-gray-300">Payment transactions linked to your agreements</p>
      </div>

      {!user?.id ? (
        <Card className="p-5"><p role="alert" className="text-sm text-red-700 dark:text-red-300">{loadError}</p></Card>
      ) : loading ? (
        <Card className="p-5"><p className="text-sm text-gray-600 dark:text-gray-300">Loading payment records…</p></Card>
      ) : loadError ? (
        <Card className="p-5"><p role="alert" className="text-sm text-red-700 dark:text-red-300">{loadError}</p></Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="p-4 text-center"><p className="text-sm text-gray-600 dark:text-gray-400">Received</p><p className="mt-2 text-xl font-bold text-green-700 dark:text-green-400">{currencyTotals(paidPayments)}</p></Card>
            <Card className="p-4 text-center"><p className="text-sm text-gray-600 dark:text-gray-400">Paid transactions</p><p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{paidPayments.length}</p></Card>
            <Card className="p-4 text-center"><p className="text-sm text-gray-600 dark:text-gray-400">Pending transactions</p><p className="mt-2 text-3xl font-bold text-amber-600">{payments.filter((payment) => payment.status === 'PENDING' || payment.status === 'AUTHORIZED').length}</p></Card>
          </div>
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Payment details</h2>
            {payments.length === 0 ? (
              <Card className="p-6 text-sm text-gray-600 dark:text-gray-300">No payment transactions are recorded for your agreements.</Card>
            ) : payments.map((payment) => {
              const agreement = payment.agreementId ? agreementById.get(payment.agreementId) : undefined;
              const StatusIcon = payment.status === 'PAID' ? Check : payment.status === 'PENDING' || payment.status === 'AUTHORIZED' ? Clock : AlertCircle;
              return (
                <Card key={payment.id} className="p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{payment.tenant?.fullName || payment.tenant?.email || 'Tenant details unavailable'}</h3>
                      <p className="mt-1 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><Home size={14} />{agreement ? listingNames.get(agreement.listingId) || 'Property details unavailable' : 'Property details unavailable'}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-5">
                      <div><p className="text-xs text-gray-500 dark:text-gray-400">Recorded</p><p className="text-sm font-medium">{new Date(payment.createdAt).toLocaleDateString()}</p></div>
                      <div><p className="text-xs text-gray-500 dark:text-gray-400">Amount</p><p className="text-lg font-bold text-gray-900 dark:text-white">{payment.currency} {payment.amount.toLocaleString()}</p></div>
                      <div><span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(payment.status)}`}><StatusIcon size={14} />{payment.status.replace(/_/g, ' ')}</span></div>
                      <div><p className="text-xs text-gray-500 dark:text-gray-400">Method</p><p className="text-sm font-medium">{payment.method.replace(/_/g, ' ')}</p></div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentsReceived;
