import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

const baseStyles =
  'inline-flex items-center justify-center rounded-[12px] font-semibold transition-transform duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed';

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-[#C045FF] via-[#FF6B9D] to-[#8B3FFF] text-white shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-[1px] active:brightness-110 disabled:bg-[#E9ECEF] disabled:text-[#6C757D]',
  secondary:
    'bg-white text-[#C045FF] border-2 border-[#C045FF] hover:bg-[#F4E6FF] hover:text-[#8B3FFF] active:bg-[#8B3FFF] active:text-white disabled:text-[#6C757D] disabled:border-[#E9ECEF] disabled:bg-transparent',
  ghost:
    'bg-transparent text-[#C045FF] hover:bg-[#F4E6FF] hover:text-[#8B3FFF] active:bg-[#8B3FFF] active:text-white disabled:text-[#6C757D]',
  danger:
    'bg-[#DC3545] text-white hover:bg-[#C82333] shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] disabled:bg-[#E9ECEF] disabled:text-[#6C757D]'
};

const sizeStyles: Record<ButtonSize, string> = {
  md: 'h-12 px-6 text-base',
  sm: 'h-10 px-4 text-sm rounded-[8px]',
  lg: 'h-14 px-8 text-lg',
  icon: 'h-12 w-12 rounded-full'
};

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', leftIcon, rightIcon, className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      {...props}
    >
      {leftIcon && <span className="mr-2 flex items-center text-lg">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2 flex items-center text-lg">{rightIcon}</span>}
    </button>
  )
);

Button.displayName = 'Button';
