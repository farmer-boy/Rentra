import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/ui/Card';

export default function AdminProfile() {
  const { isDark } = useTheme();
  return (
    <div>
      <div className="mb-6">
        <h2 className={`text-xl font-extrabold tracking-tight mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Admin Profile 👨‍💼</h2>
        <p className={`text-[13px] ${isDark ? 'text-[#555]' : 'text-gray-600'}`}>Apni admin details dekho</p>
      </div>

      <Card>
        <div className={`text-[13px] font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Admin Information</div>
        <div className={`flex gap-3 p-3 ${isDark ? 'bg-[#1f1f1f] border-white/10' : 'bg-gray-50'} border rounded-lg`}>
          <div className="w-14 h-14 rounded-full bg-purple-500/10 border-2 border-purple-500 flex items-center justify-center text-lg font-bold text-purple-600 flex-shrink-0">
            AD
          </div>
          <div>
            <div className={`text-[12px] font-bold ${isDark ? 'text-[#ddd]' : 'text-gray-800'}`}>Admin Profile</div>
            <div className={`text-[11px] ${isDark ? 'text-[#888]' : 'text-gray-600'}`}>Manage system and moderation</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
