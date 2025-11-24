import React from 'react';

export function Card({ children, className = '' }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-xl p-4 bg-transparent ${className}`}>
      {children}
    </div>
  );
}

export default Card;
