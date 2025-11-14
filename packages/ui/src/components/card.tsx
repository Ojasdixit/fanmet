import clsx from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export const Card = ({ elevated = false, className, ...props }: CardProps) => (
  <div
    className={clsx(
      'rounded-[16px] border border-[#E9ECEF] bg-white p-6 transition-shadow',
      elevated ? 'shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)]' : 'shadow-[var(--shadow-sm)]',
      className
    )}
    {...props}
  />
);

type CardHeaderBaseProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'>;

interface CardHeaderProps extends CardHeaderBaseProps {
  title?: ReactNode;
  subtitle?: ReactNode;
}

export const CardHeader = ({ title, subtitle, className, children, ...props }: CardHeaderProps) => (
  <div className={clsx('mb-4 flex flex-col gap-1', className)} {...props}>
    {title ? <h3 className="text-xl font-semibold text-[#212529]">{title}</h3> : null}
    {subtitle ? <p className="text-sm text-[#6C757D]">{subtitle}</p> : null}
    {children}
  </div>
);

export const CardContent = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx('flex flex-col gap-4', className)} {...props} />
);

export const CardFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx('mt-4 flex items-center justify-between gap-3', className)} {...props} />
);
