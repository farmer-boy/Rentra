interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down';
  color?: string;
}

export default function StatCard({ label, value, change, changeType, color }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm transition-colors hover:border-border-strong hover:shadow-md">
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
