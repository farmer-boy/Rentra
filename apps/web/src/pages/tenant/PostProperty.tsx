import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import { ApiError } from '../../api/api-error';
import { usersAPI } from '../../api/users';
import { useAuthStore } from '../../store/authStore';

export default function TenantPostProperty() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);

  const enableLandlordAccount = async () => {
    if (!user) return;
    setLoading(true);
    try {
      try {
        await usersAPI.getLandlordProfile();
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 404) throw error;
        await usersAPI.createLandlordProfile({ displayName: user.fullName });
      }
      navigate('/dashboard/host-verification');
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Could not set up your landlord account. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="p-6 md:p-8">
        <h1 className="text-2xl font-bold text-gray-900 ">Become a landlord</h1>
        <p className="mt-2 text-sm text-gray-600 ">
          Your account starts in the tenant workspace. Set up your landlord profile and complete identity and host verification. The landlord workspace opens after both are approved; your tenant workspace stays available.
        </p>
        <button
          type="button"
          onClick={() => void enableLandlordAccount()}
          disabled={loading}
          className="mt-6 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-primary-contrast transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Opening verification…' : 'Continue to landlord verification'}
        </button>
      </Card>
    </div>
  );
}
