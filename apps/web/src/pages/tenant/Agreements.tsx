import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/ui/Card';
import Pill from '../../components/ui/Pill';

export default function Agreements() {
  const { isDark } = useTheme();
  return (
    <div>
      <div className="mb-6">
        <h2 className={`text-xl font-extrabold tracking-tight mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Digital Rent Agreements 📄</h2>
        <p className={`text-[13px] ${isDark ? 'text-[#555]' : 'text-gray-500'}`}>AI-generated legally structured agreements — valid in court</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Active Agreements */}
        <Card>
          <div className={`text-[13px] font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Active Agreements</div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-[12px]">
            <thead>
              <tr className={`border-b ${isDark ? 'border-white/10' : 'border-gray-300'}`}>
                <th className={`text-left text-[10px] font-mono pb-2 ${isDark ? 'text-[#555]' : 'text-gray-500'}`}>PROPERTY</th>
                <th className={`text-left text-[10px] font-mono pb-2 ${isDark ? 'text-[#555]' : 'text-gray-500'}`}>PARTIES</th>
                <th className={`text-left text-[10px] font-mono pb-2 ${isDark ? 'text-[#555]' : 'text-gray-500'}`}>RENT</th>
                <th className={`text-left text-[10px] font-mono pb-2 ${isDark ? 'text-[#555]' : 'text-gray-500'}`}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr className={`border-b ${isDark ? 'border-white/10' : 'border-gray-300'}`}>
                <td className={`py-2 ${isDark ? 'text-[#aaa]' : 'text-gray-700'}`}>Johar Town Flat</td>
                <td className={`${isDark ? 'text-[#aaa]' : 'text-gray-700'}`}>Ali ↔ Ahmed</td>
                <td className={`text-green-600`}>Rs 9,500</td>
                <td><Pill variant="green">Active</Pill></td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="py-2">Gulberg Room</td>
                <td>Sara ↔ Tariq</td>
                <td>Rs 14,000</td>
                <td><Pill variant="blue">Pending Sign</Pill></td>
              </tr>
              <tr>
                <td className="py-2">DHA Studio</td>
                <td>Hamza ↔ Rafiq</td>
                <td>Rs 28,000</td>
                <td><Pill variant="yellow">Expired</Pill></td>
              </tr>
            </tbody>
          </table>
          </div>
        </Card>

        {/* Agreement Preview */}
        <Card>
          <div className={`text-[13px] font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Agreement Preview — Johar Town</div>
          <div className={`border rounded-lg p-4 text-[11px] space-y-2 mb-4 ${isDark ? 'bg-[#0f0f0f] border-white/10' : 'bg-gray-50 border-gray-300'}`}>
            <h4 className={`text-center text-[12px] font-bold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>🏠 KIRAYANAMA (RENT AGREEMENT)</h4>
            <div className={isDark ? 'text-[#888]' : 'text-black'}><strong>Tenant:</strong> Ali Raza (CNIC: 35202-XXXXX)</div>
            <div className={isDark ? 'text-[#888]' : 'text-black'}><strong>Landlord:</strong> Ahmed Malik (CNIC: 35201-XXXXX)</div>
            <div className={isDark ? 'text-[#888]' : 'text-black'}><strong>Property:</strong> Room, Street 5, Johar Town, Lahore</div>
            <div className={isDark ? 'text-[#888]' : 'text-black'}><strong>Monthly Rent:</strong> Rs 9,500/- (Nine Thousand Five Hundred)</div>
            <div className={isDark ? 'text-[#888]' : 'text-black'}><strong>Security Deposit:</strong> Rs 19,000/-</div>
            <div className={isDark ? 'text-[#888]' : 'text-black'}><strong>Duration:</strong> 12 months (Jan 2025 – Jan 2026)</div>
            <div className={isDark ? 'text-[#888]' : 'text-black'}><strong>Terms:</strong> Rent 5 tarikh tak, 1 month notice zaroori hai...</div>
            <div className="flex gap-2 pt-2">
              <Pill variant="green">✓ Tenant Signed</Pill>
              <Pill variant="green">✓ Landlord Signed</Pill>
            </div>
          </div>
          <button className="w-full bg-green-500 text-black px-4 py-2 rounded-lg font-semibold text-[12px] hover:bg-green-400 transition-colors">
            📥 Download PDF
          </button>
        </Card>
      </div>
    </div>
  );
}
