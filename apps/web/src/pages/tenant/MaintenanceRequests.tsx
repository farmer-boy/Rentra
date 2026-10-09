import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/ui/Card';

export default function MaintenanceRequests() {
  const { isDark } = useTheme();

  return (
    <div>
      <div className="mb-6">
        <h1 className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>Maintenance Requests</h1>
        <p className={`text-[13px] ${isDark ? 'text-gray-300' : 'text-gray-600'} mt-1`}>View and submit maintenance requests for your rental.</p>
      </div>
      <Card>
        <div className="py-8 text-center">
          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Maintenance requests are not available yet.</p>
          <p className="mt-2 text-xs text-gray-500">There is currently no maintenance-request API for submitting or retrieving requests.</p>
        </div>
      </Card>
    </div>
  );
}
