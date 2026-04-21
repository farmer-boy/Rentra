import { useState } from 'react';
import { CheckCircle, Clock, AlertCircle, Home, User } from 'lucide-react';
import Card from '../../components/ui/Card';

interface MaintenanceRequest {
  id: string;
  tenantName: string;
  property: string;
  issueType: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'assigned' | 'completed';
  reportedDate: string;
  estimatedCompletion: string;
}

const LandlordMaintenanceRequests = () => {
  const [requests] = useState<MaintenanceRequest[]>([
    {
      id: '1',
      tenantName: 'John Smith',
      property: 'Modern 2BR Apartment Downtown',
      issueType: 'Plumbing',
      description: 'Leaking kitchen faucet needs repair',
      priority: 'medium',
      status: 'open',
      reportedDate: '2024-04-15',
      estimatedCompletion: '2024-04-18',
    },
    {
      id: '2',
      tenantName: 'Sarah Johnson',
      property: 'Spacious 3BR House with Backyard',
      issueType: 'HVAC',
      description: 'Air conditioning not working properly',
      priority: 'high',
      status: 'assigned',
      reportedDate: '2024-04-14',
      estimatedCompletion: '2024-04-16',
    },
    {
      id: '3',
      tenantName: 'Michael Brown',
      property: 'Spacious 3BR House with Backyard',
      issueType: 'Electrical',
      description: 'Bedroom outlet is not functioning',
      priority: 'low',
      status: 'completed',
      reportedDate: '2024-04-05',
      estimatedCompletion: '2024-04-10',
    },
  ]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'assigned':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle size={16} />;
      case 'assigned':
        return <Clock size={16} />;
      case 'completed':
        return <CheckCircle size={16} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Maintenance Requests</h1>
        <p className="text-gray-600 dark:text-gray-300">Manage tenant maintenance and repair requests</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{requests.filter(r => r.status !== 'completed').length} active request(s)</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <Card className="p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Open</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{requests.filter(r => r.status === 'open').length}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">In Progress</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{requests.filter(r => r.status === 'assigned').length}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Completed</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{requests.filter(r => r.status === 'completed').length}</p>
        </Card>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {requests.map((request) => (
          <Card key={request.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{request.issueType}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(request.priority)}`}>
                    {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)} Priority
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <div className="flex items-center gap-1">
                    <User size={14} />
                    {request.tenantName}
                  </div>
                  <div className="flex items-center gap-1">
                    <Home size={14} />
                    {request.property}
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{request.description}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">Reported {new Date(request.reportedDate).toLocaleDateString()}</p>
              </div>

              <div className="ml-4 flex flex-col gap-3 min-w-fit">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                  {getStatusIcon(request.status)}
                  {request.status === 'open' ? 'Open' : request.status === 'assigned' ? 'Assigned' : 'Completed'}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Est. Completion</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{new Date(request.estimatedCompletion).toLocaleDateString()}</p>
                </div>
                {request.status !== 'completed' && (
                  <button className="px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition text-xs font-semibold">
                    {request.status === 'open' ? 'Assign' : 'Update'}
                  </button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LandlordMaintenanceRequests;
