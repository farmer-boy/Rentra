import { useTheme } from '../../context/ThemeContext';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Pill from '../../components/ui/Pill';

export default function LandlordDashboard() {
  const { isDark } = useTheme();
  return (
    <div>
      <div className="mb-3">
        <h2 className={`text-lg font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
          Landlord Dashboard 🏢
        </h2>
        <p className={`text-[11px] ${isDark ? 'text-gray-700' : 'text-gray-500'} mt-0.5`}>Manage your properties and tenants</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4">
        <StatCard label="MY PROPERTIES" value="4" change="1 new this month" changeType="up" />
        <StatCard label="ACTIVE TENANTS" value="3" change="All on-time" changeType="up" color="text-green-400" />
        <StatCard label="MONTHLY INCOME" value="Rs 68k" change="12% increase" changeType="up" color="text-green-400" />
        <StatCard label="OPEN DISPUTES" value="1" change="Needs attention" changeType="down" color="text-red-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-3">
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-bold ${isDark ? 'text-white' : 'text-black'}`}>My Properties</span>
            <button className="text-[10px] bg-green-500 text-black px-2 py-0.5 rounded-lg font-bold hover:bg-green-400 transition-colors">
              + Post New
            </button>
          </div>
          {[
            { name: '2 Bed Flat, Gulberg', rent: 'Rs 22,000', status: 'Verified', pill: 'green' as const, tenant: 'Ali Raza' },
            { name: 'Room, Johar Town', rent: 'Rs 9,500', status: 'Verified', pill: 'green' as const, tenant: 'Sara Khan' },
            { name: 'Studio, DHA Ph 5', rent: 'Rs 31,000', status: 'Pending', pill: 'yellow' as const, tenant: 'Vacant' },
          ].map((p, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-white/7 last:border-0">
              <div>
                <div className="text-[11px] font-semibold">{p.name}</div>
                <div className="text-[10px] text-gray-500">Tenant: {p.tenant}</div>
              </div>
              <div className="text-right">
                <div className="text-green-600 text-[11px] font-bold">{p.rent}</div>
                <Pill variant={p.pill}>{p.status}</Pill>
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <div className="text-[11px] font-bold mb-2">Payment Collection</div>
          {[
            { tenant: 'Ali Raza', month: 'Feb 2025', amount: 'Rs 22,000', status: 'Received', pill: 'green' as const },
            { tenant: 'Sara Khan', month: 'Feb 2025', amount: 'Rs 9,500', status: 'Received', pill: 'green' as const },
            { tenant: 'Hamza Ali', month: 'Feb 2025', amount: 'Rs 31,000', status: 'Pending', pill: 'yellow' as const },
          ].map((p, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-400 last:border-0">
              <div>
                <div className="text-[11px] font-semibold">{p.tenant}</div>
                <div className="text-[10px] text-gray-500">{p.month}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-bold text-green-600">{p.amount}</div>
                <Pill variant={p.pill}>{p.status}</Pill>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}


