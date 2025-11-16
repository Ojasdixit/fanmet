import clsx from 'clsx';
import type { HTMLAttributes } from 'react';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'danger' | 'warning' | 'live';

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[#F8F9FA] text-[#6C757D]',
  primary: 'bg-[#F4E6FF] text-[#C045FF]',
  success: 'bg-[#D4EDDA] text-[#155724]',
  danger: 'bg-[#F8D7DA] text-[#721C24]',
  warning: 'bg-[#FFF3CD] text-[#856404]',
  live: 'bg-[#DC3545] text-white animate-pulse',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  pill?: boolean;
}

export const Badge = ({ variant = 'default', pill = true, className, ...props }: BadgeProps) => (
  <span
    className={clsx(
      'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
      pill ? 'rounded-full' : 'rounded-[6px]',
      variantStyles[variant],
      className
    )}
    {...props}
  />
);
