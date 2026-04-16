import { useTheme } from '../../context/ThemeContext';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down';
  color?: string;
}

export default function StatCard({ label, value, change, changeType, color }: StatCardProps) {
  const { isDark } = useTheme();
  return (
    <div className={`${isDark ? 'bg-[#1f1f1f] border-white/10 hover:border-white/20' : 'bg-white border-gray-200 hover:border-gray-300'} border rounded-xl p-4 transition-colors`}>
      <div className={`text-[10px] font-mono ${isDark ? 'text-[#555]' : 'text-gray-500'} tracking-widest mb-2`}>{label}</div>
      <div className={`text-3xl font-extrabold tracking-tight ${color || (isDark ? 'text-white' : 'text-black')}`}>{value}</div>
      {change && (
        <div className={`text-[11px] mt-1 ${changeType === 'up' ? 'text-green-600' : 'text-red-500'}`}>
          {changeType === 'up' ? '↑' : '↓'} {change}
        </div>
      )}
    </div>
  );
}
