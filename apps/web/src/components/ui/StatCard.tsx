interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down';
  color?: string;
}

export default function StatCard({ label, value, change, changeType, color }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary-soft/45 via-surface to-surface p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md">
      <div className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-gradient-to-r from-primary via-blue-500 to-amber-400" />
      <div className="mb-2 text-[10px] font-mono tracking-widest text-text-muted">{label}</div>
      <div className={`text-3xl font-extrabold tracking-tight ${color || 'text-text'}`}>{value}</div>
      {change && (
        <div className={`text-[11px] mt-1 ${changeType === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {changeType === 'up' ? '↑' : '↓'} {change}
        </div>
      )}
    </div>
  );
}
