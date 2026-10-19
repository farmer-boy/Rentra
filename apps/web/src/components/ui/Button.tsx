interface ButtonProps {
  variant?: 'primary' | 'ghost' | 'danger';
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
}

const styles = {
  primary: 'bg-primary text-primary-contrast shadow-sm hover:bg-primary-hover hover:shadow-md',
  ghost: 'border border-border bg-surface2 text-text hover:border-border-strong hover:bg-surface3',
  danger: 'border border-danger/30 bg-danger text-danger-contrast shadow-sm hover:bg-red-700 hover:shadow-md',
};

export default function Button({ variant = 'primary', children, onClick, type = 'button', disabled, className = '', fullWidth }: ButtonProps) {
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
