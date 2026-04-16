import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/ui/Card';
import Pill from '../../components/ui/Pill';

export default function RentEstimator() {
  const { isDark } = useTheme();
  return (
    <div>
      <div className="mb-6">
        <h2 className={`text-xl font-extrabold tracking-tight mb-1 ${isDark ? 'text-white' : 'text-black'}`}>AI Fair Rent Estimator 💡</h2>
        <p className={`text-[13px] ${isDark ? 'text-[#555]' : 'text-gray-500'}`}>Area aur amenities ke hisaab se fair rent pata karo</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Input Form */}
        <Card>
          <div className={`text-[13px] font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Property Details Dalo</div>
          <div className="space-y-4">
            <div>
              <label className={`block text-[10px] font-mono tracking-widest mb-1.5 ${isDark ? 'text-[#555]' : 'text-gray-600'}`}>AREA / LOCATION</label>
              <select defaultValue="gulberg" className={`w-full ${isDark ? 'bg-[#0f0f0f] border-white/10 text-white' : 'bg-gray-50 border-gray-300 text-black'} border rounded-lg px-3 py-2 text-[13px] outline-none focus:border-green-500 transition-colors`} aria-label="Area/Location">
                <option value="gulberg">Gulberg III</option>
                <option value="johar">Johar Town</option>
                <option value="dha">DHA Phase 5</option>
                <option value="model">Model Town</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-[10px] font-mono tracking-widest mb-1.5 ${isDark ? 'text-[#555]' : 'text-gray-600'}`}>PROPERTY TYPE</label>
                <select defaultValue="flat" className={`w-full ${isDark ? 'bg-[#0f0f0f] border-white/10 text-white' : 'bg-gray-50 border-gray-300 text-black'} border rounded-lg px-3 py-2 text-[13px] outline-none focus:border-green-500 transition-colors`} aria-label="Property type">
                  <option value="flat">Flat</option>
                  <option value="room">Room</option>
                  <option value="house">House</option>
                </select>
              </div>
              <div>
                <label className={`block text-[10px] font-mono tracking-widest mb-1.5 ${isDark ? 'text-[#555]' : 'text-gray-600'}`}>SIZE (SQFT)</label>
                <input defaultValue="800" placeholder="Enter size in SQFT" className={`w-full ${isDark ? 'bg-[#0f0f0f] border-white/10 text-white placeholder-[#666]' : 'bg-gray-50 border-gray-300 text-black placeholder-gray-400'} border rounded-lg px-3 py-2 text-[13px] outline-none focus:border-green-500`} aria-label="Size in SQFT" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-[10px] font-mono tracking-widest mb-1.5 ${isDark ? 'text-[#555]' : 'text-gray-600'}`}>BEDROOMS</label>
                <select defaultValue="2" className={`w-full ${isDark ? 'bg-[#0f0f0f] border-white/10 text-white' : 'bg-gray-50 border-gray-300 text-black'} border rounded-lg px-3 py-2 text-[13px] outline-none focus:border-green-500`} aria-label="Number of bedrooms">
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
              </div>
              <div>
                <label className={`block text-[10px] font-mono tracking-widest mb-1.5 ${isDark ? 'text-[#555]' : 'text-gray-600'}`}>FLOOR</label>
                <select className={`w-full ${isDark ? 'bg-[#0f0f0f] border-white/10 text-white' : 'bg-gray-50 border-gray-300 text-black'} border rounded-lg px-3 py-2 text-[13px] outline-none focus:border-green-500`} aria-label="Floor level">
                  <option>Ground</option>
                  <option>1st</option>
                  <option>2nd</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="px-3 py-1.5 bg-green-100 border border-green-300 rounded-lg text-[11px] font-semibold text-green-700">Gas ✓</span>
              <span className="px-3 py-1.5 bg-green-100 border border-green-300 rounded-lg text-[11px] font-semibold text-green-700">Electricity ✓</span>
              <span className="px-3 py-1.5 bg-green-100 border border-green-300 rounded-lg text-[11px] font-semibold text-green-700">Water ✓</span>
              <span className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg text-[11px] font-semibold text-gray-700 cursor-pointer hover:bg-gray-200">Parking</span>
            </div>
            <button className="w-full bg-green-500 text-black px-4 py-2.5 rounded-lg font-semibold text-[13px] hover:bg-green-400 transition-colors">
              🤖 Estimate Karo
            </button>
          </div>
        </Card>

        {/* Estimation Result */}
        <Card>
          <div className="text-[13px] font-bold mb-4">AI Estimation Result</div>
          <div className="text-center mb-6">
            <div className="text-[11px] font-mono text-gray-500 mb-2 tracking-widest">FAIR RENT RANGE</div>
            <div className="text-4xl font-extrabold text-green-600 mb-1">Rs 19,500</div>
            <div className="text-[12px] text-gray-600">Range: Rs 17,000 – Rs 22,000</div>
          </div>
          <div className="bg-green-100 border border-green-300 rounded-lg p-3 text-[12px] text-green-700 mb-4">
            ✅ Gulberg III mein 2 bed flat ke liye yeh price fair hai
          </div>
          <div className="text-[11px] font-mono text-gray-500 mb-2">SIMILAR LISTINGS</div>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left text-[10px] font-mono text-gray-500 pb-2">LISTING</th>
                <th className="text-left text-[10px] font-mono text-gray-500 pb-2">RENT</th>
                <th className="text-left text-[10px] font-mono text-gray-500 pb-2">VS FAIR</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-300">
                <td className="py-2">Flat A, Gulberg</td>
                <td>Rs 20,000</td>
                <td><Pill variant="green">Fair</Pill></td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="py-2">Flat B, Gulberg</td>
                <td>Rs 28,000</td>
                <td><Pill variant="red">+44% Over</Pill></td>
              </tr>
              <tr>
                <td className="py-2">Flat C, Gulberg</td>
                <td>Rs 18,000</td>
                <td><Pill variant="green">Fair</Pill></td>
              </tr>
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
