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
  primary: 'bg-primary text-primary-contrast shadow-md shadow-primary/20 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/25 active:translate-y-px',
  ghost: 'border border-primary/20 bg-primary-soft/40 text-text hover:border-primary/40 hover:bg-primary-soft/75',
  danger: 'border border-danger/30 bg-danger text-danger-contrast shadow-sm shadow-danger/15 hover:bg-red-700 hover:shadow-md',
};

export default function Button({ variant = 'primary', children, onClick, type = 'button', disabled, className = '', fullWidth }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${styles[variant]} ${fullWidth ? 'w-full' : ''} px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}
