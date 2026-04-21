import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/ui/Card';
import Pill from '../../components/ui/Pill';

export default function Payments() {
  const { isDark } = useTheme();
  return (
    <div>
      <div className="mb-6">
        <h2 className={`text-xl font-extrabold tracking-tight mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Rent Payments 💳</h2>
        <p className={`text-[13px] ${isDark ? 'text-[#555]' : 'text-gray-500'}`}>JazzCash / EasyPaisa se rent do — automatic receipt milegi</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Pay Rent Now */}
        <Card>
          <div className={`text-[13px] font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Pay Rent Now</div>
          <div className={`${isDark ? 'bg-[#1f1f1f] border-white/10' : 'bg-gray-50'} border rounded-lg p-4 mb-4`}>
            <div className={`text-[10px] font-mono mb-1 tracking-widest ${isDark ? 'text-[#555]' : 'text-gray-600'}`}>CURRENT MONTH DUE</div>
            <div className="text-2xl font-extrabold text-green-600 mb-1">Rs 9,500</div>
            <div className={`text-[12px] ${isDark ? 'text-[#555]' : 'text-gray-600'}`}>Johar Town Room · Due: 5 Feb 2025</div>
          </div>
          <div className="space-y-3 mb-4">
            <div>
              <label className={`block text-[10px] font-mono tracking-widest mb-1.5 ${isDark ? 'text-[#555]' : 'text-gray-600'}`}>PAYMENT METHOD</label>
              <select className={`w-full ${isDark ? 'bg-[#0f0f0f] border-white/10 text-white' : 'bg-gray-50 border-gray-300 text-black'} border rounded-lg px-3 py-2 text-[13px] outline-none focus:border-green-500 transition-colors`} title="Payment method">
                <option>📱 JazzCash</option>
                <option>📱 EasyPaisa</option>
                <option>🏦 Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className={`block text-[10px] font-mono tracking-widest mb-1.5 ${isDark ? 'text-[#555]' : 'text-gray-600'}`}>MOBILE NUMBER</label>
              <input defaultValue="+92 306 41411" placeholder="Mobile number" className={`w-full ${isDark ? 'bg-[#0f0f0f] border-white/10 text-white placeholder-[#666]' : 'bg-gray-50 border-gray-300 text-black placeholder-gray-400'} border rounded-lg px-3 py-2 text-[13px] outline-none focus:border-green-500 transition-colors`} />
            </div>
          </div>
          <button className="w-full bg-green-500 text-black px-4 py-2.5 rounded-lg font-semibold text-[13px] hover:bg-green-400 transition-colors mb-2" title="Pay rent">
            Pay Rs 9,500 →
          </button>
          <div className={`text-[11px] text-center ${isDark ? 'text-[#555]' : 'text-gray-600'}`}>Auto receipt generate hogi aur save hogi</div>
        </Card>

        {/* Payment History */}
        <Card>
          <div className={`text-[13px] font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Payment History</div>
          <div className="space-y-3">
            {[
              { month: 'February 2025', date: '3 Feb 2025', method: 'JazzCash', amount: 9500, status: 'green' as const },
              { month: 'January 2025', date: '5 Jan 2025', method: 'JazzCash', amount: 9500, status: 'green' as const },
              { month: 'December 2024', date: '7 Dec 2024', method: 'EasyPaisa', amount: 9500, status: 'yellow' as const },
              { month: 'November 2024', date: '4 Nov 2024', method: 'JazzCash', amount: 9500, status: 'green' as const },
            ].map((payment, idx) => (
              <div key={idx} className={`flex justify-between items-start p-3 ${isDark ? 'bg-[#1f1f1f] border-white/10' : 'bg-gray-50'} rounded-lg border`}>
                <div>
                  <div className={`text-[12px] font-bold ${isDark ? 'text-white' : 'text-black'}`}>{payment.month}</div>
                  <div className={`text-[11px] ${isDark ? 'text-[#555]' : 'text-gray-600'}`}>{payment.method} · {payment.date}</div>
                </div>
                <div className="text-right">
                  <div className={`text-[12px] font-bold ${payment.status === 'green' ? 'text-green-600' : 'text-yellow-600'}`}>
                    Rs {payment.amount.toLocaleString()}
                  </div>
                  <div><Pill variant={payment.status}>{payment.status === 'green' ? 'Paid' : 'Late'}</Pill></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
