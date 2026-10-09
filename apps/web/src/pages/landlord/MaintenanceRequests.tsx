import { Wrench } from 'lucide-react';
import Card from '../../components/ui/Card';

const LandlordMaintenanceRequests = () => (
  <div className="space-y-6">
    <div>
      <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Maintenance Requests</h1>
      <p className="text-gray-600 dark:text-gray-300">View and manage maintenance reported by tenants</p>
    </div>
    <Card className="p-6">
      <div className="flex items-start gap-3">
        <Wrench className="mt-1 text-gray-500" size={20} />
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">Live maintenance data unavailable</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Maintenance requests are not currently available from the backend for landlords. No request list, counts, or status updates can be shown here.
          </p>
        </div>
      </div>
    </Card>
  </div>
);

export default LandlordMaintenanceRequests;
