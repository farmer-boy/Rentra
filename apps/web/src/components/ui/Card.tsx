import { useTheme } from '../../context/useTheme';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = '' }: CardProps) {
  const { isDark } = useTheme();
  return (
    <div className={`backdrop-blur-none border rounded-2xl p-6 shadow-sm transition-all duration-300 hover:shadow-md ${
      isDark
        ? 'bg-[var(--surface)] border-[var(--border)] shadow-black/25 hover:bg-[var(--surface2)] hover:border-[var(--border2)]'
        : 'bg-[var(--surface)] border-[var(--border)] shadow-gray-100/60 hover:bg-[var(--surface2)] hover:border-[var(--border2)] hover:shadow-gray-200/40'
    } ${className}`}>
      {children}
    </div>
  );
}
