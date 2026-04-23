import { useState } from 'react';
import Card from '../../components/ui/Card';
import { Bot, CheckCircle, XCircle } from 'lucide-react';

interface FakeListingReport {
  id: string;
  listing: string;
  landlord: string;
  confidence: number;
  suspiciousFactors: string[];
  reportedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

const AdminFakeDetectorQueue = () => {
  const [reports] = useState<FakeListingReport[]>([
    {
      id: '1',
      listing: 'Luxury Penthouse - Amazing Price',
      landlord: 'Unknown User',
      confidence: 98,
      suspiciousFactors: ['Unusually low price', 'Stock photos detected', 'New account'],
      reportedAt: '2026-04-16T10:30:00',
      status: 'pending',
    },
    {
      id: '2',
      listing: 'Spacious Villa with Pool',
      landlord: 'Ahmed Khan',
      confidence: 45,
      suspiciousFactors: ['Geographic inconsistency'],
      reportedAt: '2026-04-15T14:20:00',
      status: 'pending',
    },
    {
      id: '3',
      listing: 'Studio Apartment DHA',
      landlord: 'Sarah Smith',
      confidence: 12,
      suspiciousFactors: [],
      reportedAt: '2026-04-14T08:15:00',
      status: 'approved',
    },
  ]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-red-600 dark:text-red-400';
    if (confidence >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getConfidenceBg = (confidence: number) => {
    if (confidence >= 80) return 'bg-red-100 dark:bg-red-900/30';
    if (confidence >= 50) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-green-100 dark:bg-green-900/30';
  };

  const pendingCount = reports.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Fake Detector Queue
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Review AI-flagged listings for potential fraud
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
        <Card className="p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Pending</p>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{pendingCount}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Approved</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
            {reports.filter((r) => r.status === 'approved').length}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Rejected</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
            {reports.filter((r) => r.status === 'rejected').length}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total</p>
          <p className="text-3xl font-bold text-gray-600 dark:text-gray-400 mt-2">{reports.length}</p>
        </Card>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.map((report) => (
          <Card key={report.id} className="p-5">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Bot size={20} className="text-blue-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {report.listing}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Landlord: <span className="font-medium">{report.landlord}</span>
                  </p>
                </div>

                {/* Confidence Score */}
                <div className={`px-4 py-2 rounded-lg text-center ${getConfidenceBg(report.confidence)}`}>
                  <p className={`text-sm font-bold ${getConfidenceColor(report.confidence)}`}>
                    {report.confidence}% Fake
                  </p>
                </div>
              </div>

              {/* Suspicious Factors */}
              {report.suspiciousFactors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">
                    ⚠️ Suspicious Factors:
                  </p>
                  <ul className="space-y-1">
                    {report.suspiciousFactors.map((factor, idx) => (
                      <li key={idx} className="text-sm text-red-600 dark:text-red-300">
                        • {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {new Date(report.reportedAt).toLocaleString()}
                </p>

                {report.status === 'pending' ? (
                  <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold text-sm transition">
                      <CheckCircle size={16} />
                      Approve
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold text-sm transition">
                      <XCircle size={16} />
                      Reject
                    </button>
                  </div>
                ) : (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      report.status === 'approved'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {report.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                  </span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminFakeDetectorQueue;
