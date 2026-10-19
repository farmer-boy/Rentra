import { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Pill from '../../components/ui/Pill';
import { paymentsAPI } from '../../api/payments';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  provider: string;
  status: string;
  bookingId: string | null;
  agreementId: string | null;
  billingMonth: string | null;
  paidAt: string | null;
  createdAt: string;
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    paymentsAPI.getMyPayments()
      .then((records) => {
        if (active) setPayments(Array.isArray(records) ? records as Payment[] : []);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const getStatusVariant = (status: string): 'green' | 'yellow' | 'red' => {
    if (status === 'SUCCESS' || status === 'PAID' || status === 'COMPLETED') return 'green';
    if (status === 'FAILED') return 'red';
    return 'yellow';
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className={`text-xl font-extrabold tracking-tight mb-1 text-text`}>Rent Payments 💳</h2>
        <p className={`text-[13px] text-text-muted`}>Payments recorded on your account</p>
      </div>

      <Card>
        <div className={`text-[13px] font-bold mb-4 text-text`}>Payment History</div>
        {loading ? (
          <p className="py-6 text-center text-[12px] text-gray-500">Loading payment history…</p>
        ) : error ? (
          <p role="alert" className="py-6 text-center text-[12px] text-red-500">Unable to load payment history right now.</p>
        ) : payments.length === 0 ? (
          <p className="py-6 text-center text-[12px] text-gray-500">No payment records are available for your account.</p>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div key={payment.id} className="flex justify-between items-start gap-3 p-3 bg-surface-2 border-border rounded-lg border">
                <div>
                  <div className={`text-[12px] font-bold text-text`}>
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </div>
                  <div className={`text-[11px] text-text-muted`}>
                    {payment.provider.replace(/_/g, ' ')} · {payment.agreementId ? `Agreement ${payment.agreementId}` : `Booking ${payment.bookingId}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-[12px] font-bold ${payment.status === 'SUCCESS' || payment.status === 'PAID' || payment.status === 'COMPLETED' ? 'text-green-600' : payment.status === 'FAILED' ? 'text-red-600' : 'text-yellow-600'}`}>
                    {payment.currency} {Number(payment.amount).toLocaleString()}
                  </div>
                  <Pill variant={getStatusVariant(payment.status)}>{payment.status}</Pill>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className={`text-[11px] text-center mt-4 text-text-muted`}>
          Payment records and statuses come from the backend. Online payment initiation is unavailable because no payment provider adapter is configured on the backend.
        </p>
      </Card>
    </div>
  );
}
