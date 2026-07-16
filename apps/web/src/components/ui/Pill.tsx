import { useTheme } from '../../context/ThemeContext';

interface PillProps {
  variant: 'green' | 'red' | 'yellow' | 'blue';
  children: React.ReactNode;
}

const lightStyles = {
  green: 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 hover:border-green-300',
  red: 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:border-red-300',
  yellow: 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 hover:border-amber-300',
  blue: 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300',
};

const darkStyles = {
  green: 'bg-[#0f3d1f] text-green-400 border border-green-500/30',
  red: 'bg-[#3d0f0f] text-red-400 border border-red-500/30',
  yellow: 'bg-[#3d3d0f] text-yellow-400 border border-yellow-500/30',
  blue: 'bg-[#0f1f3d] text-blue-400 border border-blue-500/30',
};

export default function Pill({ variant, children }: PillProps) {
  const { isDark } = useTheme();
  const styles = isDark ? darkStyles : lightStyles;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${styles[variant]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}
