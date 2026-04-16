import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/ui/Card';
import Pill from '../../components/ui/Pill';

export default function Profile() {
  const { isDark } = useTheme();
  return (
    <div>
      <div className="mb-6">
        <h2 className={`text-xl font-extrabold tracking-tight mb-1 ${isDark ? 'text-white' : 'text-black'}`}>My Profile 👤</h2>
        <p className={`text-[13px] ${isDark ? 'text-[#555]' : 'text-gray-600'}`}>Apni details aur trust score dekho</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Personal Information */}
        <Card>
          <div className={`text-[13px] font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Personal Information</div>
          <div className={`flex gap-3 mb-4 p-3 ${isDark ? 'bg-[#1f1f1f] border-white/10' : 'bg-gray-50'} border rounded-lg`}>
            <div className="w-14 h-14 rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center text-lg font-bold text-green-600 flex-shrink-0">
              AR
            </div>
            <div className="flex-1">
              <div className={`font-bold text-[13px] ${isDark ? 'text-white' : 'text-black'}`}>Ali Raza</div>
              <div className={`text-[11px] ${isDark ? 'text-[#555]' : 'text-gray-600'}`}>subssems336@gmail.com</div>
              <div className={`text-[11px] ${isDark ? 'text-[#555]' : 'text-gray-600'}`}>+92 306 41411 · Lahore</div>
              <div className="mt-1"><Pill variant="green">Verified</Pill></div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className={`block text-[10px] font-mono tracking-widest mb-1.5 ${isDark ? 'text-[#555]' : 'text-gray-600'}`}>FULL NAME</label>
              <input defaultValue="Ali Raza" className={`w-full ${isDark ? 'bg-[#0f0f0f] border-white/10 text-white' : 'bg-gray-50 border-gray-300 text-black'} border rounded-lg px-3 py-2 text-[12px] outline-none focus:border-green-500 transition-colors`} aria-label="Full name" />
            </div>
            <div>
              <label className={`block text-[10px] font-mono tracking-widest mb-1.5 ${isDark ? 'text-[#555]' : 'text-gray-600'}`}>PHONE</label>
              <input defaultValue="+92 306 41411" className={`w-full ${isDark ? 'bg-[#0f0f0f] border-white/10 text-white' : 'bg-gray-50 border-gray-300 text-black'} border rounded-lg px-3 py-2 text-[12px] outline-none focus:border-green-500 transition-colors`} aria-label="Phone number" />
            </div>
            <div>
              <label className={`block text-[10px] font-mono tracking-widest mb-1.5 ${isDark ? 'text-[#555]' : 'text-gray-600'}`}>CNIC</label>
              <input defaultValue="35202-XXXXXXX-X" className={`w-full ${isDark ? 'bg-[#0f0f0f] border-white/10 text-white' : 'bg-gray-50 border-gray-300 text-black'} border rounded-lg px-3 py-2 text-[12px] outline-none focus:border-green-500 transition-colors`} aria-label="CNIC" />
            </div>
          </div>
          <button className="w-full bg-green-500 text-black px-4 py-2.5 rounded-lg font-semibold text-[12px] hover:bg-green-400 transition-colors mt-4" title="Save Profile Changes">
            Save Changes
          </button>
        </Card>

        {/* Trust Score */}
        <Card>
          <div className="text-[13px] font-bold mb-4">My Trust Score</div>
          <div className="flex gap-3 mb-4">
            <div className="w-20 h-20 rounded-full bg-green-500/10 border-3 border-green-500 flex items-center justify-center font-bold text-green-600 flex-shrink-0">
              <div className="text-center">
                <div className="text-2xl">82</div>
                <div className="text-[8px]">/100</div>
              </div>
            </div>
            <div>
              <div className="font-bold text-[13px] mb-1">Good Standing 🟢</div>
              <div className="text-[11px] text-gray-600 space-y-0.5">
                <div>Total Rentals: 3</div>
                <div>On-time Payments: 98%</div>
                <div>Disputes Filed: 0</div>
                <div>Avg Rating: 4.7 ★</div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Payment History', score: 95 },
              { label: 'Property Care', score: 80 },
              { label: 'Communication', score: 70 },
              { label: 'Dispute History', score: 100 },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-[11px] text-gray-600 mb-1">
                  <span>{item.label}</span>
                  <span>{item.score}/100</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
                  <div
                    className={`h-full ${item.score >= 80 ? 'bg-green-500' : item.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
