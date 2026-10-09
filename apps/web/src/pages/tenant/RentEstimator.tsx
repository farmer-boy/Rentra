import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/ui/Card';

export default function RentEstimator() {
  const { isDark } = useTheme();
  return (
    <div>
      <div className="mb-6">
        <h2 className={`text-xl font-extrabold tracking-tight mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Fair Rent Estimator</h2>
        <p className={`text-[13px] ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Estimate a property's rent using current local market data.</p>
      </div>
      <Card>
        <div className="py-8 text-center">
          <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Rent estimates are not available yet.</p>
          <p className="mt-2 text-xs text-gray-500">There is currently no rent-estimation API or verified market-data source. No estimate or comparable listings can be shown.</p>
        </div>
      </Card>
    </div>
  );
}
