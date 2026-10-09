import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/ui/Card';

export default function AIDetector() {
  const { isDark } = useTheme();
  return (
    <div>
      <div className="mb-6">
        <h2 className={`text-xl font-extrabold tracking-tight mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Listing Safety Information</h2>
        <p className={`text-[13px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Live detector results and listing-risk analysis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <Card>
          <div className={`text-[13px] font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Flagged Listings</div>
          <p className={`py-6 text-center text-[12px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            No live flagged-listing data is available. The backend does not provide a detector queue for this screen.
          </p>
        </Card>
        <Card>
          <div className={`text-[13px] font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Detection Results</div>
          <p className={`py-6 text-center text-[12px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            No detector API is available for authenticity checks, fraud probabilities, or risk signals.
          </p>
        </Card>
      </div>
    </div>
  );
}
