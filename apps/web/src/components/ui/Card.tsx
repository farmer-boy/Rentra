interface CardProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export default function Card({ children, className = '', id }: CardProps) {
  return (
    <div id={id} className={`backdrop-blur-none rounded-2xl border border-border bg-surface p-6 ${className}`}>
      {children}
    </div>
  );
}
