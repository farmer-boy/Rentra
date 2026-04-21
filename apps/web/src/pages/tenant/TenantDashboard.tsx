import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Pill from '../../components/ui/Pill';
import { Bot, Lightbulb, Star, FileText, CreditCard, Scale, Home } from 'lucide-react';

export default function TenantDashboard() {
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const quickActions = [
    { icon: <Home size={16} />, label: 'Browse Listings', path: '/tenant/listings', color: 'bg-blue-500/20 text-blue-600' },
    { icon: <Bot size={16} />, label: 'Fake Detector', path: '/tenant/detector', color: 'bg-red-500/20 text-red-600' },
    { icon: <Lightbulb size={16} />, label: 'Rent Estimator', path: '/tenant/estimator', color: 'bg-amber-500/20 text-amber-600' },
    { icon: <Star size={16} />, label: 'Trust Scores', path: '/tenant/trust', color: 'bg-green-500/20 text-green-600' },
    { icon: <FileText size={16} />, label: 'Agreements', path: '/tenant/agreement', color: 'bg-purple-500/20 text-purple-600' },
    { icon: <CreditCard size={16} />, label: 'Payments', path: '/tenant/payments', color: 'bg-teal-500/20 text-teal-600' },
  ];

  return (
    <div>
      <div className="mb-3">
        <h1 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
          Welcome back, {user?.fullName?.split(' ')[0]} 👋
        </h1>
        <p className={`text-xs ${isDark ? 'text-[#666]' : 'text-gray-600'} mt-0.5`}>Pakistan's AI-powered transparent rental platform</p>
      </div>

      {/* Quick Actions */}
      <div className="mb-4">
        <div className={`text-xs font-bold mb-2 ${isDark ? 'text-[#666]' : 'text-gray-500'} uppercase tracking-widest`}>Quick Access</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5 md:gap-2">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className={`${action.color} p-2 rounded-lg hover:opacity-90 transition-all text-center flex flex-col items-center gap-1 ${isDark ? 'hover:bg-opacity-30' : 'hover:bg-opacity-25'}`}
            >
              {action.icon}
              <span className="text-[10px] font-semibold">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4">
        <StatCard label="ACTIVE LISTINGS" value="1,284" change="12% this week" changeType="up" />
        <StatCard label="FAKE DETECTED" value="47" change="AI flagged today" changeType="down" color="text-red-600" />
        <StatCard label="AGREEMENTS SIGNED" value="328" change="8% this month" changeType="up" color="text-green-600" />
        <StatCard label="DISPUTES RESOLVED" value="19" change="3 this week" changeType="up" color="text-yellow-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        {/* Recent Listings */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-black'}`}>Recent Listings</span>
            <span className={`text-xs font-mono ${isDark ? 'text-[#555] hover:text-green-500' : 'text-gray-500 hover:text-green-600'} cursor-pointer`}>View All →</span>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr className="text-left">
                {['Property', 'Area', 'Rent', 'Status'].map(h => (
                  <th key={h} className={`text-xs font-mono ${isDark ? 'text-[#555] border-white/10' : 'text-gray-500 border-gray-200'} tracking-widest pb-2 border-b`}>{h}</th>
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
                  <td className={`py-2 text-xs ${isDark ? 'text-[#aaa]' : 'text-gray-600'}`}>{row.name}</td>
                  <td className={`py-2 text-xs ${isDark ? 'text-[#aaa]' : 'text-gray-600'}`}>{row.area}</td>
                  <td className="py-2 text-xs text-green-600">{row.rent}</td>
                  <td className="py-2"><Pill variant={row.pill}>{row.status}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>

        {/* Trust Score */}
        <Card>
          <div className="text-xs font-bold mb-3">My Trust Score</div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-16 h-16 rounded-full bg-green-100 border-2 border-green-300 flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-xl font-extrabold text-green-700">{user?.trustScore}</span>
              <span className="text-xs text-green-600">/100</span>
            </div>
            <div>
              <div className="text-sm font-bold mb-1">Good Standing</div>
              <div className="text-xs text-gray-600 space-y-0.5">
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
            <div key={bar.label} className="mb-2">
              <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                <span>{bar.label}</span><span>{bar.val}</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${bar.color} rounded-full transition-all`}
                  data-progress={bar.val}
                  style={{ width: `${bar.val}%` } as any}
                />
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <div className="text-xs font-bold mb-2">Recent Activity</div>
        <div className="space-y-1.5">
          {[
            { icon: '🤖', text: 'AI flagged', highlight: '3 Bed House, Model Town', suffix: 'as potentially fake listing', time: '2 min ago', color: 'text-red-600' },
            { icon: '📄', text: 'Rent agreement signed with', highlight: 'Landlord Ahmed Malik', suffix: 'for Johar Town flat', time: '1 hour ago', color: 'text-green-600' },
            { icon: '💳', text: 'Rent payment of', highlight: 'Rs 9,500', suffix: 'sent via JazzCash — receipt saved', time: 'Yesterday', color: 'text-green-600' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="text-base pt-0.5">{item.icon}</span>
              <div className="flex-1">
                <span className={isDark ? 'text-white' : 'text-black'}>{item.text} </span>
                <span className={item.color}>{item.highlight} </span>
                <span className={isDark ? 'text-[#555]' : 'text-gray-500'}>{item.suffix}</span>
              </div>
              <span className={`text-xs font-mono whitespace-nowrap ${isDark ? 'text-[#555]' : 'text-gray-500'}`}>{item.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
