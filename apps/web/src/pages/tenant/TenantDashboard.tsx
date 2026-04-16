import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Pill from '../../components/ui/Pill';

export default function TenantDashboard() {
  const { user } = useAuthStore();
  const { isDark } = useTheme();

  return (
    <div>
      <div className="mb-6">
        <h2 className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
          Welcome back, {user?.fullName?.split(' ')[0]} 👋
        </h2>
        <p className={`text-[13px] ${isDark ? 'text-[#555]' : 'text-gray-500'} mt-1`}>Pakistan ka pehla AI-powered transparent rental platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="ACTIVE LISTINGS" value="1,284" change="12% this week" changeType="up" />
        <StatCard label="FAKE DETECTED" value="47" change="AI flagged today" changeType="down" color="text-red-600" />
        <StatCard label="AGREEMENTS SIGNED" value="328" change="8% this month" changeType="up" color="text-green-600" />
        <StatCard label="DISPUTES RESOLVED" value="19" change="3 this week" changeType="up" color="text-yellow-600" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Recent Listings */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <span className={`text-[13px] font-bold ${isDark ? 'text-white' : 'text-black'}`}>Recent Listings</span>
            <span className={`text-[11px] font-mono ${isDark ? 'text-[#555] hover:text-green-500' : 'text-gray-500 hover:text-green-600'} cursor-pointer`}>View All →</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-left">
                {['Property', 'Area', 'Rent', 'Status'].map(h => (
                  <th key={h} className={`text-[10px] font-mono ${isDark ? 'text-[#555] border-white/10' : 'text-gray-500 border-gray-200'} tracking-widest pb-2 border-b`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: '2 Bed Flat', area: 'Gulberg', rent: 'Rs 22,000', status: 'Verified', pill: 'green' as const },
                { name: '1 Room', area: 'Johar Town', rent: 'Rs 9,500', status: 'Verified', pill: 'green' as const },
                { name: 'Studio Flat', area: 'DHA Ph 5', rent: 'Rs 31,000', status: 'Pending', pill: 'yellow' as const },
                { name: '3 Bed House', area: 'Model Town', rent: 'Rs 35,000', status: 'Flagged 🤖', pill: 'red' as const },
              ].map((row, i) => (
                <tr key={i} className={`${isDark ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-50'} transition-colors`}>
                  <td className={`py-2.5 text-[13px] ${isDark ? 'text-[#aaa]' : 'text-gray-600'}`}>{row.name}</td>
                  <td className={`py-2.5 text-[13px] ${isDark ? 'text-[#aaa]' : 'text-gray-600'}`}>{row.area}</td>
                  <td className="py-2.5 text-[13px] text-green-600">{row.rent}</td>
                  <td className="py-2.5"><Pill variant={row.pill}>{row.status}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Trust Score */}
        <Card>
          <div className="text-[13px] font-bold mb-4">My Trust Score</div>
          <div className="flex items-center gap-5 mb-4">
            <div className="w-20 h-20 rounded-full bg-green-100 border-2 border-green-300 flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-2xl font-extrabold text-green-700">{user?.trustScore}</span>
              <span className="text-[9px] text-green-600">/100</span>
            </div>
            <div>
              <div className="text-[15px] font-bold mb-1">Good Standing</div>
              <div className="text-[12px] text-gray-600 space-y-0.5">
                <div>Rent history: Clean</div>
                <div>Disputes: 0</div>
                <div>Reviews: 4.7 ★</div>
              </div>
            </div>
          </div>
          {[
            { label: 'Payment History', val: 95, color: 'bg-green-500' },
            { label: 'Property Care', val: 80, color: 'bg-green-500' },
            { label: 'Communication', val: 70, color: 'bg-yellow-500' },
          ].map(bar => (
            <div key={bar.label} className="mb-3">
              <div className="flex justify-between text-[11px] text-gray-600 mb-1">
                <span>{bar.label}</span><span>{bar.val}</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
                <div className={`h-full ${bar.color} rounded-full`} style={{ width: `${bar.val}%` }} />
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <div className="text-[13px] font-bold mb-4">Recent Activity</div>
        <div className="space-y-3">
          {[
            { icon: '🤖', text: 'AI flagged', highlight: '3 Bed House, Model Town', suffix: 'as potentially fake listing', time: '2 min ago', color: 'text-red-600' },
            { icon: '📄', text: 'Rent agreement signed with', highlight: 'Landlord Ahmed Malik', suffix: 'for Johar Town flat', time: '1 hour ago', color: 'text-green-600' },
            { icon: '💳', text: 'Rent payment of', highlight: 'Rs 9,500', suffix: 'sent via JazzCash — receipt saved', time: 'Yesterday', color: 'text-green-600' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-[13px]">
              <span className="text-base">{item.icon}</span>
              <div className="flex-1">
                <span className={isDark ? 'text-white' : 'text-black'}>{item.text} </span>
                <span className={item.color}>{item.highlight} </span>
                <span className={isDark ? 'text-[#555]' : 'text-gray-500'}>{item.suffix}</span>
              </div>
              <span className={`text-[11px] font-mono whitespace-nowrap ${isDark ? 'text-[#555]' : 'text-gray-500'}`}>{item.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
