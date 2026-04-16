import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/ui/Card';
import Pill from '../../components/ui/Pill';

export default function AIDetector() {
  const { isDark } = useTheme();
  return (
    <div>
      <div className="mb-6">
        <h2 className={`text-xl font-extrabold tracking-tight mb-1 ${isDark ? 'text-white' : 'text-black'}`}>AI Fake Listing Detector 🤖</h2>
        <p className={`text-[13px] ${isDark ? 'text-[#555]' : 'text-gray-500'}`}>Machine learning se fraudulent listings pakadta hai</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Flagged Listings Queue */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <span className={`text-[13px] font-bold ${isDark ? 'text-white' : 'text-black'}`}>Flagged Listings — Review Queue</span>
          </div>
          <table className="w-full text-[12px]">
            <thead>
              <tr className={`border-b ${isDark ? 'border-white/10' : 'border-gray-300'}`}>
                <th className={`text-left text-[10px] font-mono pb-2 ${isDark ? 'text-[#555]' : 'text-gray-500'}`}>LISTING</th>
                <th className={`text-left text-[10px] font-mono pb-2 ${isDark ? 'text-[#555]' : 'text-gray-500'}`}>FRAUD %</th>
                <th className={`text-left text-[10px] font-mono pb-2 ${isDark ? 'text-[#555]' : 'text-gray-500'}`}>REASON</th>
                <th className={`text-left text-[10px] font-mono pb-2 ${isDark ? 'text-[#555]' : 'text-gray-500'}`}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              <tr className={`border-b ${isDark ? 'border-white/10' : 'border-gray-300'}`}>
                <td className={`py-3 ${isDark ? 'text-[#aaa]' : 'text-black'}`}>3 Bed, Model Town</td>
                <td className="text-red-600 font-bold">87%</td>
                <td className={`text-[11px] ${isDark ? 'text-[#555]' : 'text-gray-600'}`}>Stolen photos</td>
                <td><Pill variant="red">Remove</Pill></td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="py-3">Luxury Villa, DHA</td>
                <td className="text-red-600 font-bold">91%</td>
                <td className="text-gray-600 text-[11px]">Price anomaly</td>
                <td><Pill variant="red">Remove</Pill></td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="py-3">Room, Samanabad</td>
                <td className="text-yellow-600 font-bold">54%</td>
                <td className="text-gray-600 text-[11px]">Low photo count</td>
                <td><Pill variant="yellow">Review</Pill></td>
              </tr>
              <tr>
                <td className="py-3">Flat, Bahria Town</td>
                <td className="text-yellow-600 font-bold">61%</td>
                <td className="text-gray-600 text-[11px]">Spam account</td>
                <td><Pill variant="yellow">Review</Pill></td>
              </tr>
            </tbody>
          </table>
        </Card>

        {/* AI Detection Signals */}
        <Card>
          <div className={`text-[13px] font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>AI Detection Signals</div>
          <div className="space-y-4">
            <div>
              <div className={`flex justify-between text-[12px] mb-2 ${isDark ? 'text-[#555]' : 'text-gray-600'}`}>
                <span>📸 Photo Authenticity</span>
                <span className="text-red-600 font-bold">HIGH RISK</span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#1f1f1f]' : 'bg-gray-200'}`}>
                {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
                <div className="h-full bg-red-500" style={{ width: '87%' }}></div>
              </div>
            </div>
            <div>
              <div className={`flex justify-between text-[12px] mb-2 ${isDark ? 'text-[#555]' : 'text-gray-600'}`}>
                <span>💰 Price vs Area Ratio</span>
                <span className="text-yellow-600 font-bold">SUSPICIOUS</span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#1f1f1f]' : 'bg-gray-200'}`}>
                {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
                <div className="h-full bg-yellow-500" style={{ width: '61%' }}></div>
              </div>
            </div>
            <div>
              <div className={`flex justify-between text-[12px] mb-2 ${isDark ? 'text-[#555]' : 'text-gray-600'}`}>
                <span>📝 Description Pattern</span>
                <span className="text-green-600 font-bold">NORMAL</span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#1f1f1f]' : 'bg-gray-200'}`}>
                {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
                <div className="h-full bg-green-500" style={{ width: '20%' }}></div>
              </div>
            </div>
            <div>
              <div className={`flex justify-between text-[12px] mb-2 ${isDark ? 'text-[#555]' : 'text-gray-600'}`}>
                <span>👤 Account Posting Freq</span>
                <span className="text-red-600 font-bold">HIGH RISK</span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#1f1f1f]' : 'bg-gray-200'}`}>
                {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
                <div className="h-full bg-red-500" style={{ width: '91%' }}></div>
              </div>
            </div>
          </div>
          <div className={`mt-4 p-3 border rounded-lg text-[12px] ${isDark ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            ⚠️ Overall Fraud Probability: <strong>87%</strong> — Admin review required
          </div>
        </Card>
      </div>
    </div>
  );
}
