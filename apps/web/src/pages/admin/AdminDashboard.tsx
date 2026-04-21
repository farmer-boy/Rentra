import { useTheme } from '../../context/ThemeContext';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Pill from '../../components/ui/Pill';

export default function AdminDashboard() {
  const { isDark } = useTheme();
  return (
    <div>
      <div className="mb-3">
        <h2 className={`text-lg font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>Admin Dashboard 🛡️</h2>
        <p className={`text-[11px] ${isDark ? 'text-[#555]' : 'text-gray-400'}`}>Platform moderation, users, and analytics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4">
        <StatCard label="TOTAL USERS" value="4,821" change="234 this week" changeType="up" />
        <StatCard label="LISTINGS (LIVE)" value="1,284" change="89 today" changeType="up" />
        <StatCard label="FLAGGED TODAY" value="47" change="Need review" changeType="down" color="text-red-400" />
        <StatCard label="OPEN DISPUTES" value="12" change="Action needed" changeType="down" color="text-yellow-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <Card>
          <div className={`text-[11px] font-bold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>Pending Moderation Queue</div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr>
                {['Listing', 'AI Score', 'Action'].map(h => (
                  <th key={h} className={`text-left text-[9px] font-mono ${isDark ? 'text-[#555] border-white/10' : 'text-gray-500 border-gray-300'} tracking-widest pb-2 border-b`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'DHA Villa — Fake Photos', score: '91%', color: 'text-red-500', pill: 'red' as const, action: 'Remove' },
                { name: 'Gulberg Flat — Price Anomaly', score: '61%', color: 'text-yellow-600', pill: 'yellow' as const, action: 'Review' },
                { name: 'Johar Flat — New User', score: '12%', color: 'text-green-600', pill: 'green' as const, action: 'Approve' },
                { name: 'Ichra Room — Low Photos', score: '45%', color: 'text-yellow-600', pill: 'yellow' as const, action: 'Review' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-gray-100 transition-colors">
                  <td className="py-2 text-[11px] text-gray-600">{row.name}</td>
                  <td className={`py-2 text-[11px] font-bold ${row.color}`}>{row.score} fraud</td>
                  <td className="py-2"><Pill variant={row.pill}>{row.action}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>

        <Card>
          <div className="text-[13px] font-bold mb-4">User Management</div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr>
                {['User', 'Role', 'Trust', 'Status'].map(h => (
                  <th key={h} className="text-left text-[10px] font-mono text-gray-500 tracking-widest pb-2 border-b border-gray-300">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Ali Raza', role: 'Tenant', trust: 82, pill: 'green' as const, status: 'Active' },
                { name: 'Ahmed Malik', role: 'Landlord', trust: 91, pill: 'green' as const, status: 'Active' },
                { name: 'Bilal Ahmed', role: 'Tenant', trust: 28, pill: 'red' as const, status: 'Flagged' },
                { name: 'Rafiq Chaudhry', role: 'Landlord', trust: 19, pill: 'red' as const, status: 'Suspended' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-gray-100 transition-colors">
                  <td className="py-2.5 text-[13px] font-semibold">{row.name}</td>
                  <td className="py-2.5 text-[13px] text-gray-600">{row.role}</td>
                  <td className={`py-2.5 text-[13px] font-bold ${row.trust > 60 ? 'text-green-600' : 'text-red-500'}`}>{row.trust}</td>
                  <td className="py-2.5"><Pill variant={row.pill}>{row.status}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
