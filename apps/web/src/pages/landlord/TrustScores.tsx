import { useEffect, useState } from 'react';
import { AlertCircle, Star } from 'lucide-react';
import api from '../../api/client';
import Card from '../../components/ui/Card';

interface RentalRequest {
  id: string;
  status: string;
  tenant: { id: string; fullName: string };
  listing?: { title: string } | null;
  property?: { title: string } | null;
}
interface ApplicantScore extends RentalRequest { trustScore: number | null }

const LandlordTrustScores = () => {
  const [applicants, setApplicants] = useState<ApplicantScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/rental-requests/received');
        const requests: RentalRequest[] = Array.isArray(data) ? data : data.data ?? [];
        const enriched = await Promise.all(requests.map(async (request) => {
          const { data: profile } = await api.get(`/users/${request.tenant.id}`);
          return { ...request, trustScore: profile.trustScore ?? null };
        }));
        setApplicants(enriched);
      } catch (requestError: any) {
        setError(requestError.response?.data?.message || 'Tenant trust scores could not be loaded.');
      } finally { setLoading(false); }
    };
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Tenant Trust Scores</h1><p className="text-gray-600 dark:text-gray-300">Trust scores from applicants who have sent you a rental request</p></div>
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400">
        <div className="flex items-start gap-3"><AlertCircle size={20} className="text-blue-600 dark:text-blue-300 flex-shrink-0 mt-0.5" /><p className="text-sm text-blue-800 dark:text-blue-300">The score shown is the tenant account trust score returned by the profile API. A detailed score breakdown is not currently available.</p></div>
      </Card>
      {loading ? <p className="text-sm text-gray-500">Loading rental applicants...</p> : error ? <p role="alert" className="text-sm text-red-600">{error}</p> : applicants.length === 0 ? <Card className="p-5 text-sm text-gray-500">No rental requests have been received.</Card> : (
        <div className="space-y-4">{applicants.map((applicant) => (
          <Card key={applicant.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div><h3 className="text-lg font-semibold text-gray-900 dark:text-white">{applicant.tenant.fullName}</h3><p className="text-sm text-gray-600 dark:text-gray-400">{applicant.listing?.title || applicant.property?.title || 'Property not specified'}</p><p className="mt-1 text-xs text-gray-500">Request status: {applicant.status.replace('_', ' ').toLowerCase()}</p></div>
              <div className="rounded-lg bg-gray-100 px-4 py-2 text-center dark:bg-gray-800"><div className="flex items-center justify-center gap-1">{applicant.trustScore == null ? <span className="text-sm text-gray-500">Not available</span> : <><Star size={16} className="fill-yellow-400 text-yellow-400" /><span className="text-2xl font-bold">{applicant.trustScore}</span></>}</div><p className="text-xs text-gray-500">Trust score {applicant.trustScore == null ? '' : '/100'}</p></div>
            </div>
          </Card>
        ))}</div>
      )}
    </div>
  );
};

export default LandlordTrustScores;
