"use client";
import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' };

export function Button({ variant = 'primary', className = '', ...props }: Props) {
  const base = 'inline-flex items-center justify-center rounded-md font-semibold transition-colors focus:outline-none px-4 py-2';
  const variants: Record<string, string> = {
    primary: 'bg-gradient-to-r from-cyan-400 to-indigo-500 text-white shadow-lg',
    ghost: 'bg-transparent text-gray-800 dark:text-gray-200',
    danger: 'bg-gradient-to-r from-pink-500 to-red-500 text-white'
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export default Button;
