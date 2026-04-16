import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/ui/Card';
import Pill from '../../components/ui/Pill';

export default function TrustScores() {
  const { isDark } = useTheme();
  return (
    <div>
      <div className="mb-6">
        <h2 className={`text-xl font-extrabold tracking-tight mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Trust Scores ⭐</h2>
        <p className={`text-[13px] ${isDark ? 'text-[#555]' : 'text-gray-500'}`}>Tenant aur landlord dono ke AI-generated trust scores</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Tenant Scores */}
        <Card>
          <div className={`text-[13px] font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Tenant Scores</div>
          <div className="space-y-3">
            {[
              { name: 'Ali Raza', score: 82, details: '3 rentals · 0 disputes · On-time 98%', pill: 'green' as const, status: 'Highly Trusted' },
              { name: 'Usman Khan', score: 61, details: '1 rental · 1 dispute · On-time 70%', pill: 'yellow' as const, status: 'Average' },
              { name: 'Bilal Ahmed', score: 28, details: '2 rentals · 3 disputes · On-time 40%', pill: 'red' as const, status: 'Low Trust' },
            ].map((tenant) => (
              <div key={tenant.name} className={`p-3 rounded-lg flex items-center gap-3 ${isDark ? 'bg-[#1f1f1f]' : 'bg-gray-50'}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg ${
                  tenant.score >= 70 ? `${isDark ? 'bg-[#0f3d1f] text-green-400 border-2 border-green-500' : 'bg-green-100 text-green-700 border-2 border-green-400'}` :
                  tenant.score >= 50 ? `${isDark ? 'bg-[#3d3d0f] text-yellow-400 border-2 border-yellow-500' : 'bg-yellow-100 text-yellow-700 border-2 border-yellow-400'}` :
                  `${isDark ? 'bg-[#3d0f0f] text-red-400 border-2 border-red-500' : 'bg-red-100 text-red-700 border-2 border-red-400'}`
                }`}>
                  {tenant.score}<small className="text-[10px]">/100</small>
                </div>
                <div className="flex-1">
                  <div className={`font-bold text-[13px] ${isDark ? 'text-white' : 'text-black'}`}>{tenant.name}</div>
                  <div className={`text-[11px] ${isDark ? 'text-[#555]' : 'text-gray-600'}`}>{tenant.details}</div>
                  <div className="mt-1"><Pill variant={tenant.pill}>{tenant.status}</Pill></div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Landlord Scores */}
        <Card>
          <div className={`text-[13px] font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Landlord Scores</div>
          <div className="space-y-3">
            {[
              { name: 'Ahmed Malik', score: 91, details: '5 tenants · Deposit returned 100%', pill: 'green' as const, status: 'Excellent' },
              { name: 'Tariq Hussain', score: 55, details: '3 tenants · Deposit returned 60%', pill: 'yellow' as const, status: 'Moderate' },
              { name: 'Rafiq Chaudhry', score: 19, details: '4 tenants · 3 illegal evictions reported', pill: 'red' as const, status: 'Avoid' },
            ].map((landlord) => (
              <div key={landlord.name} className={`p-3 rounded-lg flex items-center gap-3 ${isDark ? 'bg-[#1f1f1f]' : 'bg-gray-50'}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg ${
                  landlord.score >= 70 ? `${isDark ? 'bg-[#0f3d1f] text-green-400 border-2 border-green-500' : 'bg-green-100 text-green-700 border-2 border-green-400'}` :
                  landlord.score >= 50 ? `${isDark ? 'bg-[#3d3d0f] text-yellow-400 border-2 border-yellow-500' : 'bg-yellow-100 text-yellow-700 border-2 border-yellow-400'}` :
                  `${isDark ? 'bg-[#3d0f0f] text-red-400 border-2 border-red-500' : 'bg-red-100 text-red-700 border-2 border-red-400'}`
                }`}>
                  {landlord.score}<small className="text-[10px]">/100</small>
                </div>
                <div className="flex-1">
                  <div className={`font-bold text-[13px] ${isDark ? 'text-white' : 'text-black'}`}>{landlord.name}</div>
                  <div className={`text-[11px] ${isDark ? 'text-[#555]' : 'text-gray-600'}`}>{landlord.details}</div>
                  <div className="mt-1"><Pill variant={landlord.pill}>{landlord.status}</Pill></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
