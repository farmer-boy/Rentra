import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/ui/Card';
import Pill from '../../components/ui/Pill';

export default function Disputes() {
  const { isDark } = useTheme();
  return (
    <div>
      <div className="mb-6">
        <h2 className={`text-xl font-extrabold tracking-tight mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Dispute Resolution ⚠\ufe0f</h2>
        <p className={`text-[13px] ${isDark ? 'text-[#555]' : 'text-gray-500'}`}>Resolve disputes within the app — no need to go to court</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Active Disputes */}
        <Card>
          <div className={`text-[13px] font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Active Disputes</div>
          <div className="space-y-3 mb-4">
            <div className={`p-4 border-l-3 border-red-500 rounded-lg ${isDark ? 'bg-[#3d0f0f]' : 'bg-red-50'}`}>
              <div className="flex justify-between mb-2">
                <span className={`text-[12px] font-bold ${isDark ? 'text-red-400' : 'text-red-700'}`}>Security Deposit Not Returned</span>
                <Pill variant="red">Open</Pill>
              </div>
              <div className={`text-[11px] mb-1 ${isDark ? 'text-[#555]' : 'text-gray-600'}`}>Ali Raza vs Tariq Hussain · DHA Studio</div>
              <div className={`text-[11px] mb-3 ${isDark ? 'text-[#555]' : 'text-gray-600'}`}>Filed: 15 Jan 2025 · Amount: Rs 56,000</div>
              <div className="flex gap-2">
                <button className={`px-3 py-1.5 border rounded-lg text-[10px] font-semibold transition-colors ${isDark ? 'bg-[#1f1f1f] border-white/10 text-[#aaa] hover:bg-[#2a2a2a]' : 'bg-gray-200 border-gray-300 hover:bg-gray-300'}`}>Evidence Add</button>
                <button className="px-3 py-1.5 bg-green-500 text-black rounded-lg text-[10px] font-semibold hover:bg-green-400">Message →</button>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 border-l-3 border-yellow-500 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-[12px] font-bold">Maintenance Issue</span>
                <Pill variant="yellow">Mediation</Pill>
              </div>
              <div className="text-[11px] text-gray-600 mb-1">Sara Khan vs Ahmed Malik · Gulberg Flat</div>
              <div className="text-[11px] text-gray-600">Filed: 10 Jan 2025 · Plumbing problem</div>
            </div>
          </div>
          <button className="w-full bg-green-500 text-black px-4 py-2 rounded-lg font-semibold text-[12px] hover:bg-green-400 transition-colors">
            + File New Dispute
          </button>
        </Card>

        {/* Dispute Chat */}
        <Card>
          <div className="text-[13px] font-bold mb-4">Dispute Chat — Security Deposit Case</div>
          <div className="h-56 bg-[#1f1f1f] rounded-lg p-3 mb-3 overflow-y-auto flex flex-col gap-2">
            <div className="text-[11px] bg-[#2a2a2a] rounded-lg p-2 max-w-xs">
              I vacated the property on 31 Dec. You were supposed to return the deposit within 2 weeks as per the agreement.
            </div>
            <div className="text-[11px] bg-green-500/10 text-green-400 rounded-lg p-2 max-w-xs ml-auto border border-green-500/20">
              There was damage to the property. I got it repaired — it cost Rs 15,000.
            </div>
            <div className="text-[11px] bg-[#2a2a2a] rounded-lg p-2 max-w-xs">
              There was no mention of damage in the agreement. I'm demanding the full deposit.
            </div>
            <div className="text-[10px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-lg p-2 text-center">
              🤖 Platform Mediator: Evidence is being requested from both parties — submit within 7 days
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type message..."
              className="flex-1 bg-[#1f1f1f] border border-white/7 rounded-lg px-3 py-2 text-[12px] text-white outline-none focus:border-green-500"
            />
            <button className="px-4 py-2 bg-green-500 text-black rounded-lg font-semibold text-[11px] hover:bg-green-400">Send</button>
          </div>
        </Card>
      </div>
    </div>
  );
}
