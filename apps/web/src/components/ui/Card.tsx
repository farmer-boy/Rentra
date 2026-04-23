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
        ? 'bg-[#1a2332] border-[#2d3e52] shadow-black/50 hover:bg-[#1f2938] hover:border-[#3a4a63]'
        : 'bg-white border-gray-400 shadow-gray-300/30 hover:bg-gray-50/50 hover:shadow-gray-400/40'
    } ${className}`}>
      {children}
    </div>
  );
}
