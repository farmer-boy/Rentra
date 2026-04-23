import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/ui/Card';

export default function LandlordProfile() {
  const { isDark } = useTheme();
  return (
    <div>
      <div className="mb-6">
        <h2 className={`text-xl font-extrabold tracking-tight mb-1 ${isDark ? 'text-white' : 'text-black'}`}>My Profile 👤</h2>
        <p className={`text-[13px] ${isDark ? 'text-gray-700' : 'text-gray-600'}`}>Apni details aur properties dekho</p>
      </div>

      <Card>
        <div className={`text-[13px] font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Profile Information</div>
        <div className={`flex gap-3 p-3 ${isDark ? 'bg-[#1f1f1f] border-white/10' : 'bg-gray-50'} border rounded-lg`}>
          <div className="w-14 h-14 rounded-full bg-blue-500/10 border-2 border-blue-500 flex items-center justify-center text-lg font-bold text-blue-600 flex-shrink-0">
            LL
          </div>
          <div>
            <div className={`text-[12px] font-bold ${isDark ? 'text-[#ddd]' : 'text-gray-800'}`}>Landlord Profile</div>
            <div className={`text-[11px] ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Manage your properties and details</div>
          </div>
        </div>
      </Card>
    </div>
  );
}


