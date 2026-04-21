import { useState } from 'react';
import { AlertTriangle, CheckCircle, Home, Zap } from 'lucide-react';
import Card from '../../components/ui/Card';

interface ScanResult {
  id: string;
  property: string;
  location: string;
  price: number;
  lastScanned: string;
  fraudScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  suspiciousFactors: string[];
  verified: boolean;
}

const LandlordFakeDetector = () => {
  const [results] = useState<ScanResult[]>([
    {
      id: '1',
      property: 'Modern 2BR Apartment Downtown',
      location: 'Downtown, City Center',
      price: 2500,
      lastScanned: '2024-04-15',
      fraudScore: 5,
      riskLevel: 'low',
      suspiciousFactors: [],
      verified: true,
    },
    {
      id: '2',
      property: 'Spacious 3BR House with Backyard',
      location: 'Suburbs',
      price: 3200,
      lastScanned: '2024-04-14',
      fraudScore: 8,
      riskLevel: 'low',
      suspiciousFactors: ['Geographic mismatch in property details'],
      verified: true,
    },
    {
      id: '3',
      property: 'Cozy Studio with Garden',
      location: 'Residential Area',
      price: 1500,
      lastScanned: '2024-04-10',
      fraudScore: 35,
      riskLevel: 'medium',
      suspiciousFactors: ['Recent price changes', 'Limited property history', 'Unusual rental terms'],
      verified: false,
    },
  ]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'medium':
        return <AlertTriangle size={16} className="text-yellow-600" />;
      case 'high':
        return <AlertTriangle size={16} className="text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Fake Detector</h1>
        <p className="text-gray-600 dark:text-gray-300">AI-powered fraud detection for your listings</p>
      </div>

      {/* Summary */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400">
        <div className="flex items-start gap-3">
          <Zap size={20} className="text-blue-600 dark:text-blue-300 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-200">AI Detection System</h3>
            <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
              Our AI continuously scans your listings for suspicious activity and fraud indicators. All properties are automatically verified when posted.
            </p>
          </div>
        </div>
      </Card>

      {/* Fraud Scan Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">Your Listings</h3>
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm font-semibold">
            Scan All Listings
          </button>
        </div>

        {results.map((result) => (
          <Card key={result.id} className="p-4">
            <div className="flex items-start justify-between">
              {/* Property Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Home size={18} className="text-gray-400" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{result.property}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{result.location}</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-2">${result.price.toLocaleString()}/month</p>

                {/* Suspicious Factors */}
                {result.suspiciousFactors.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">Suspicious Factors:</p>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      {result.suspiciousFactors.map((factor, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-yellow-500 mt-1">⚠</span>
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">Last scanned: {new Date(result.lastScanned).toLocaleDateString()}</p>
              </div>

              {/* Fraud Score */}
              <div className="ml-6 flex flex-col items-end gap-3">
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Fraud Score</p>
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 border-4 border-gray-300 dark:border-gray-600">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">{result.fraudScore}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">out of 100</p>
                  </div>
                </div>

                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getRiskColor(result.riskLevel)}`}>
                  {getRiskIcon(result.riskLevel)}
                  {result.riskLevel === 'low' ? 'Low Risk' : result.riskLevel === 'medium' ? 'Medium Risk' : 'High Risk'}
                </div>

                {result.verified && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
                    <CheckCircle size={14} />
                    Verified Authentic
                  </div>
                )}

                <button className="px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition text-xs font-semibold mt-2">
                  Details
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LandlordFakeDetector;
