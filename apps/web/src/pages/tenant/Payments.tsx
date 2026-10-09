import { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/ui/Card';
import Pill from '../../components/ui/Pill';
import api from '../../api/client';

interface Payment {
  id: string;
  amount: number;
  method?: string;
  status: string;
  agreementId: string;
  createdAt: string;
}

export default function Payments() {
  const { isDark } = useTheme();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    api.get<{ data?: Payment[] }>('/payments/tenant/my-payments')
      .then(({ data }) => {
        if (active) setPayments(Array.isArray(data.data) ? data.data : []);
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
    if (status === 'PAID' || status === 'COMPLETED') return 'green';
    if (status === 'FAILED') return 'red';
    return 'yellow';
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className={`text-xl font-extrabold tracking-tight mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Rent Payments 💳</h2>
        <p className={`text-[13px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Payments recorded on your account</p>
      </div>

      <Card>
        <div className={`text-[13px] font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Payment History</div>
        {loading ? (
          <p className="py-6 text-center text-[12px] text-gray-500">Loading payment history…</p>
        ) : error ? (
          <p role="alert" className="py-6 text-center text-[12px] text-red-500">Unable to load payment history right now.</p>
        ) : payments.length === 0 ? (
          <p className="py-6 text-center text-[12px] text-gray-500">No payment records are available for your account.</p>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div key={payment.id} className={`flex justify-between items-start gap-3 p-3 ${isDark ? 'bg-[#1f1f1f] border-white/10' : 'bg-gray-50 border-gray-200'} rounded-lg border`}>
                <div>
                  <div className={`text-[12px] font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </div>
                  <div className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {payment.method ? `${payment.method} · ` : ''}Agreement {payment.agreementId}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-[12px] font-bold ${payment.status === 'PAID' || payment.status === 'COMPLETED' ? 'text-green-600' : payment.status === 'FAILED' ? 'text-red-600' : 'text-yellow-600'}`}>
                    Rs {Number(payment.amount).toLocaleString()}
                  </div>
                  <Pill variant={getStatusVariant(payment.status)}>{payment.status}</Pill>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className={`text-[11px] text-center mt-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          This view lists recorded payments only. Payment initiation requires agreement details.
        </p>
      </Card>
    </div>
  );
}
