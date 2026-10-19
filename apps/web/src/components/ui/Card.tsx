interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`backdrop-blur-none rounded-2xl border border-border bg-surface p-6 ${className}`}>
      {children}
    </div>
  );
}
