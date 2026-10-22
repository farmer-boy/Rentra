import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import Card from '../../components/ui/Card';
import Pill from '../../components/ui/Pill';
import { agreementsAPI } from '../../api/agreements';
import { useSearchParams } from 'react-router-dom';

interface Agreement {
  id: string;
  tenantId: string;
  landlordId: string;
  listingId: string;
  monthlyRent: number;
  securityDeposit: number | null;
  startDate: string;
  endDate: string | null;
  status: string;
  tenant?: { fullName: string };
  landlord?: { fullName: string };
}

export default function Agreements() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const showSignedOnly = searchParams.get('status') === 'SIGNED';
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    if (!user?.id) {
      return () => { active = false; };
    }
    agreementsAPI.mine()
      .then((records) => {
        if (active) setAgreements(records.filter((agreement) => agreement.tenantId === user.id) as Agreement[]);
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
    if (status === 'CANCELLED' || status === 'ENDED' || status === 'TERMINATED' || status === 'EXPIRED') return 'red';
    return 'yellow';
  };
  const visibleAgreements = showSignedOnly
    ? agreements.filter((agreement) => !['DRAFT', 'PENDING'].includes(agreement.status))
    : agreements;

  return (
    <div>
      <div className="mb-6">
        <h2 className={`text-xl font-extrabold tracking-tight mb-1 text-text`}>Rent Agreements 📄</h2>
        <p className={`text-[13px] text-text-muted`}>Agreements linked to your tenant account</p>
      </div>

      <Card>
        <div className={`text-[13px] font-bold mb-4 text-text`}>My Agreements</div>
        {loading ? (
          <p className="py-6 text-center text-[12px] text-gray-500">Loading agreements…</p>
        ) : error || !user?.id ? (
          <p role="alert" className="py-6 text-center text-[12px] text-red-500">Unable to load your agreements right now.</p>
        ) : visibleAgreements.length === 0 ? (
          <p className="py-6 text-center text-[12px] text-gray-500">No agreements are available for your account.</p>
        ) : (
          <div className="space-y-3">
            {visibleAgreements.map((agreement) => (
              <div key={agreement.id} className="p-4 border border-border rounded-lg bg-surface-2">
                <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                  <div>
                    <div className={`text-[13px] font-bold text-text`}>
                      {agreement.landlord?.fullName || `Landlord ${agreement.landlordId}`}
                    </div>
                    <div className={`text-[11px] text-text-muted`}>
                      Listing {agreement.listingId}
                    </div>
                  </div>
                  <Pill variant={statusVariant(agreement.status)}>{agreement.status}</Pill>
                </div>
                <div className={`grid grid-cols-2 gap-2 text-[11px] text-text-muted`}>
                  <div>Rent: Rs {Number(agreement.monthlyRent).toLocaleString()}</div>
                  <div>Deposit: Rs {Number(agreement.securityDeposit ?? 0).toLocaleString()}</div>
                  <div>Start: {new Date(agreement.startDate).toLocaleDateString()}</div>
                  <div>End: {agreement.endDate ? new Date(agreement.endDate).toLocaleDateString() : 'No end date set'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className={`text-[11px] text-center mt-4 text-text-muted`}>
          Agreement document contents and PDF downloads are not provided by the available backend API.
        </p>
      </Card>
    </div>
  );
}
