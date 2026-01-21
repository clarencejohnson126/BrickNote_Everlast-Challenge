'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:focus-visible:ring-white focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed';

    const variants = {
      primary:
        'bg-slate-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-slate-800 dark:hover:bg-neutral-200 active:bg-slate-950 dark:active:bg-neutral-300',
      secondary:
        'bg-slate-100 dark:bg-neutral-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-neutral-700 active:bg-slate-300 dark:active:bg-neutral-600 border border-slate-200 dark:border-neutral-700',
      ghost:
        'bg-transparent text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800',
      danger:
        'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs tracking-wide',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-sm tracking-wide',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
