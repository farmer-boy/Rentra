import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/ui/Card';
import Pill from '../../components/ui/Pill';
import api from '../../api/client';

interface Agreement {
  id: string;
  tenantId: string;
  landlordId: string;
  listingId: string;
  rent: number;
  deposit: number;
  startDate: string;
  endDate: string;
  status: string;
  tenant?: { fullName: string };
  landlord?: { fullName: string };
}

export default function Agreements() {
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    if (!user?.id) {
      return () => { active = false; };
    }
    api.get<{ data?: Agreement[] }>('/agreements')
      .then(({ data }) => {
        const records = Array.isArray(data.data) ? data.data : [];
        if (active) setAgreements(records.filter((agreement) => agreement.tenantId === user.id));
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
    if (status === 'ACTIVE' || status === 'SIGNED') return 'green';
    if (status === 'CANCELLED' || status === 'ENDED' || status === 'TERMINATED') return 'red';
    return 'yellow';
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className={`text-xl font-extrabold tracking-tight mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Rent Agreements 📄</h2>
        <p className={`text-[13px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Agreements linked to your tenant account</p>
      </div>

      <Card>
        <div className={`text-[13px] font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>My Agreements</div>
        {loading ? (
          <p className="py-6 text-center text-[12px] text-gray-500">Loading agreements…</p>
        ) : error || !user?.id ? (
          <p role="alert" className="py-6 text-center text-[12px] text-red-500">Unable to load your agreements right now.</p>
        ) : agreements.length === 0 ? (
          <p className="py-6 text-center text-[12px] text-gray-500">No agreements are available for your account.</p>
        ) : (
          <div className="space-y-3">
            {agreements.map((agreement) => (
              <div key={agreement.id} className={`p-4 border rounded-lg ${isDark ? 'bg-[#1f1f1f] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                  <div>
                    <div className={`text-[13px] font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                      {agreement.landlord?.fullName || `Landlord ${agreement.landlordId}`}
                    </div>
                    <div className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Listing {agreement.listingId}
                    </div>
                  </div>
                  <Pill variant={statusVariant(agreement.status)}>{agreement.status}</Pill>
                </div>
                <div className={`grid grid-cols-2 gap-2 text-[11px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <div>Rent: Rs {Number(agreement.rent).toLocaleString()}</div>
                  <div>Deposit: Rs {Number(agreement.deposit).toLocaleString()}</div>
                  <div>Start: {new Date(agreement.startDate).toLocaleDateString()}</div>
                  <div>End: {new Date(agreement.endDate).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className={`text-[11px] text-center mt-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Agreement document contents and PDF downloads are not provided by the available backend API.
        </p>
      </Card>
    </div>
  );
}
