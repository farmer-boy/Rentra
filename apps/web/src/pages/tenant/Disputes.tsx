import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/ui/Card';
import Pill from '../../components/ui/Pill';
import api from '../../api/client';

interface Dispute {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  status: string;
  agreementId: string;
  createdAt: string;
  agreement?: {
    landlord?: { fullName: string };
  };
}

export default function Disputes() {
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    if (!user?.id) {
      return () => { active = false; };
    }
    api.get<{ data?: Dispute[] }>('/disputes')
      .then(({ data }) => {
        const records = Array.isArray(data.data) ? data.data : [];
        if (active) setDisputes(records.filter((dispute) => dispute.tenantId === user.id));
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [user?.id]);

  const statusVariant = (status: string): 'green' | 'yellow' | 'red' => {
    if (status === 'RESOLVED' || status === 'CLOSED') return 'green';
    if (status === 'OPEN') return 'red';
    return 'yellow';
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className={`text-xl font-extrabold tracking-tight mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Disputes ⚠️</h2>
        <p className={`text-[13px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Disputes associated with your tenant account</p>
      </div>

      <Card>
        <div className={`text-[13px] font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>My Disputes</div>
        {loading ? (
          <p className="py-6 text-center text-[12px] text-gray-500">Loading disputes…</p>
        ) : error || !user?.id ? (
          <p role="alert" className="py-6 text-center text-[12px] text-red-500">Unable to load your disputes right now.</p>
        ) : disputes.length === 0 ? (
          <p className="py-6 text-center text-[12px] text-gray-500">No disputes are available for your account.</p>
        ) : (
          <div className="space-y-3">
            {disputes.map((dispute) => (
              <div key={dispute.id} className={`p-4 border-l-4 rounded-lg ${statusVariant(dispute.status) === 'red' ? 'border-red-500' : statusVariant(dispute.status) === 'green' ? 'border-green-500' : 'border-yellow-500'} ${isDark ? 'bg-[#1f1f1f]' : 'bg-gray-50'}`}>
                <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                  <span className={`text-[12px] font-bold ${isDark ? 'text-white' : 'text-black'}`}>{dispute.title}</span>
                  <Pill variant={statusVariant(dispute.status)}>{dispute.status}</Pill>
                </div>
                <p className={`text-[11px] mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{dispute.description}</p>
                <div className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {dispute.agreement?.landlord?.fullName ? `Landlord: ${dispute.agreement.landlord.fullName} · ` : ''}
                  Agreement {dispute.agreementId} · Filed {new Date(dispute.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
        <p className={`text-[11px] text-center mt-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Dispute messages and evidence management are not provided by the available backend API.
        </p>
      </Card>
    </div>
  );
}
