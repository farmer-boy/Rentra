import { useState } from 'react';
import { CheckCircle, XCircle, User, Briefcase, CreditCard, MapPin } from 'lucide-react';
import Card from '../../components/ui/Card';

interface Application {
  id: string;
  applicantName: string;
  property: string;
  appliedDate: string;
  income: number;
  employed: boolean;
  employer: string;
  status: 'pending' | 'approved' | 'rejected';
  tenantScore: number;
  creditScore: number;
}

const PendingApplications = () => {
  const [applications, setApplications] = useState<Application[]>([
    {
      id: '1',
      applicantName: 'Emily Davis',
      property: 'Modern 2BR Apartment Downtown',
      appliedDate: '2024-04-10',
      income: 65000,
      employed: true,
      employer: 'Tech Corp Inc.',
      status: 'pending',
      tenantScore: 4.2,
      creditScore: 750,
    },
    {
      id: '2',
      applicantName: 'Robert Wilson',
      property: 'Modern 2BR Apartment Downtown',
      appliedDate: '2024-04-08',
      income: 55000,
      employed: true,
      employer: 'Design Studio LLC',
      status: 'pending',
      tenantScore: 3.8,
      creditScore: 680,
    },
    {
      id: '3',
      applicantName: 'Lisa Anderson',
      property: 'Spacious 3BR House with Backyard',
      appliedDate: '2024-04-15',
      income: 75000,
      employed: true,
      employer: 'Finance Solutions',
      status: 'pending',
      tenantScore: 4.6,
      creditScore: 820,
    },
  ]);

  const handleApprove = (id: string) => {
    setApplications(applications.map(app =>
      app.id === id ? { ...app, status: 'approved' } : app
    ));
  };

  const handleReject = (id: string) => {
    setApplications(applications.map(app =>
      app.id === id ? { ...app, status: 'rejected' } : app
    ));
  };

  const pendingApps = applications.filter(app => app.status === 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pending Applications</h1>
        <p className="text-gray-600 dark:text-gray-300">Review and approve tenant applications</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{pendingApps.length} pending application(s)</p>
      </div>

      <div className="space-y-4">
        {applications.map((app) => (
          <Card key={app.id} className="p-5">
            <div className="flex items-start justify-between">
              {/* Applicant Info */}
              <div className="flex-1">
                <div className="mb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <User size={20} className="text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{app.applicantName}</h3>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <MapPin size={14} className="mr-1" />
                        {app.property}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-500">Applied {new Date(app.appliedDate).toLocaleDateString()}</p>
                </div>

                {/* Application Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 text-sm mb-3 pb-3 border-b border-gray-400 dark:border-gray-700">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Annual Income</p>
                    <div className="flex items-center text-gray-900 dark:text-white mt-1 font-semibold">
                      <CreditCard size={14} className="mr-2 text-green-500" />
                      ${(app.income / 1000).toFixed(0)}k
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Employment</p>
                    <p className="text-gray-900 dark:text-white mt-1 font-semibold">{app.employed ? 'Employed' : 'Unemployed'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Employer</p>
                    <p className="text-gray-900 dark:text-white mt-1 text-xs truncate">{app.employer}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Tenant Score</p>
                    <p className="text-gray-900 dark:text-white mt-1 font-semibold flex items-center">
                      ⭐ {app.tenantScore}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Credit Score</p>
                    <p className={`mt-1 font-semibold ${app.creditScore >= 750 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {app.creditScore}
                    </p>
                  </div>
                </div>

                {/* Recommendation */}
                <div className="bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-400 p-3 rounded text-sm text-blue-700 dark:text-blue-200">
                  <strong>Assessment:</strong> {app.creditScore >= 750 && app.tenantScore >= 4.0 ? 'Strong applicant - Recommended for approval' : 'Average applicant - Review additional details before deciding'}
                </div>
              </div>

              {/* Status & Actions */}
              <div className="ml-4 flex flex-col gap-2 w-32">
                {app.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => handleApprove(app.id)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-200 rounded hover:bg-green-200 dark:hover:bg-green-800 transition text-xs font-semibold"
                    >
                      <CheckCircle size={14} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(app.id)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800 transition text-xs font-semibold"
                    >
                      <XCircle size={14} />
                      Reject
                    </button>
                  </>
                ) : (
                  <div className={`px-3 py-2 rounded text-xs font-semibold text-center ${
                    app.status === 'approved'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {app.status === 'approved' ? 'Approved ✓' : 'Rejected ✗'}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PendingApplications;

