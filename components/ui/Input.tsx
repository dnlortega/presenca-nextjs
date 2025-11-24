"use client";
import React from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement> & { label?: string };

export function Input({ label, className = '', ...props }: Props) {
  return (
    <label className="flex w-full flex-col gap-2">
      {label ? <span className="text-sm font-medium">{label}</span> : null}
      <input className={`px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/70 ${className}`} {...props} />
    </label>
  );
}

export default Input;
