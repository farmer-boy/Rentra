import { useTheme } from '../../context/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = '' }: CardProps) {
  const { isDark } = useTheme();
  return (
    <div className={`backdrop-blur-xl border rounded-2xl p-6 shadow-xl transition-all duration-300 hover:shadow-2xl ${
      isDark
        ? 'bg-white/10 border-white/20 shadow-black/30 hover:bg-white/15 hover:border-white/30'
        : 'bg-white/70 border-white/80 shadow-gray-200/50 hover:bg-white/90 hover:shadow-gray-300/50'
    } ${className}`}>
      {children}
    </div>
  );
}
