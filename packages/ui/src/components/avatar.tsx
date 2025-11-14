import clsx from 'clsx';
import type { HTMLAttributes } from 'react';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const sizeMap: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-base',
  xl: 'h-20 w-20 text-lg',
};

export interface AvatarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  src?: string;
  alt?: string;
  initials?: string;
  size?: AvatarSize;
  badgeColor?: string;
}

export const Avatar = ({
  src,
  alt,
  initials,
  size = 'md',
  className,
  badgeColor,
  ...props
}: AvatarProps) => (
  <div className="relative inline-flex items-center justify-center">
    <div
      className={clsx(
        'flex items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#FF6B35] font-semibold uppercase text-white shadow-[var(--shadow-sm)]',
        sizeMap[size],
        className
      )}
      {...props}
    >
      {src ? <img className="h-full w-full object-cover" src={src} alt={alt} /> : initials ?? ''}
    </div>
    {badgeColor && (
      <span
        className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white"
        style={{ backgroundColor: badgeColor }}
      />
    )}
  </div>
);
