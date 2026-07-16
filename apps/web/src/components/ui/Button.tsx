import { useTheme } from '../../context/ThemeContext';

interface ButtonProps {
  variant?: 'primary' | 'ghost' | 'danger';
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
}

const lightStyles = {
  primary: 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 shadow-sm hover:shadow-md',
  ghost: 'bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200 hover:border-gray-400 active:bg-gray-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm hover:shadow-md',
};

const darkStyles = {
  primary: 'bg-green-500 text-black hover:bg-green-400',
  ghost: 'bg-[#1f1f1f] text-gray-300 border border-white/10 hover:text-white hover:bg-[#2a2a2a]',
  danger: 'bg-[#2a0000] text-red-400 border border-red-500/30 hover:bg-[#3a0000]',
};

export default function Button({ variant = 'primary', children, onClick, type = 'button', disabled, className = '', fullWidth }: ButtonProps) {
  const { isDark } = useTheme();
  const styles = isDark ? darkStyles : lightStyles;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${styles[variant]} ${fullWidth ? 'w-full' : ''} px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

