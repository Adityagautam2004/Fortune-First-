import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 ${
        hover
          ? 'transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
