import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-150 ease-out rounded-xl select-none active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none';

  const variants = {
    primary:
      'bg-forest-600 hover:bg-forest-700 text-white shadow-xs hover:shadow-md focus-visible:ring-forest-600 focus-visible:ring-offset-white active:bg-forest-800',
    secondary:
      'bg-stone-900 hover:bg-stone-800 text-white shadow-xs hover:shadow-md focus-visible:ring-stone-900 focus-visible:ring-offset-white',
    outline:
      'border border-stone-200/90 hover:border-forest-600/80 hover:bg-forest-50/50 text-stone-700 hover:text-forest-800 focus-visible:ring-forest-600 focus-visible:ring-offset-white bg-white shadow-2xs',
    ghost:
      'text-stone-700 hover:text-stone-950 hover:bg-stone-100/80 focus-visible:ring-stone-400 focus-visible:ring-offset-white',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-xs hover:shadow focus-visible:ring-rose-500 focus-visible:ring-offset-white',
    amber:
      'bg-amber-500 hover:bg-amber-600 text-white shadow-xs hover:shadow focus-visible:ring-amber-500 focus-visible:ring-offset-white',
  };

  const sizes = {
    sm: 'min-h-[36px] sm:min-h-[38px] px-3.5 py-1.5 text-xs gap-1.5',
    md: 'min-h-[44px] px-4 py-2.5 text-sm gap-2',
    lg: 'min-h-[48px] px-6 py-3.5 text-base gap-2.5 font-semibold',
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-current" /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};

