import { useTheme } from '../../context/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = '' }: CardProps) {
  const { isDark } = useTheme();
  return (
    <div className={`backdrop-blur-none border rounded-2xl p-6 shadow-sm transition-all duration-300 hover:shadow-md ${
      isDark
        ? 'bg-[#1a2332] border-[#2d3e52] shadow-black/50 hover:bg-[#1f2938] hover:border-[#3a4a63]'
        : 'bg-white border-gray-200 shadow-gray-100/60 hover:bg-gray-50 hover:border-gray-300 hover:shadow-gray-200/40'
    } ${className}`}>
      {children}
    </div>
  );
}
