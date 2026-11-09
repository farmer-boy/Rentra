interface CardProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export default function Card({ children, className = '', id }: CardProps) {
  return (
    <div id={id} className={`backdrop-blur-none rounded-2xl border border-primary/15 bg-gradient-to-br from-surface via-surface to-primary-soft/25 p-6 shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-primary/25 ${className}`}>
      {children}
    </div>
  );
}
