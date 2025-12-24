'use client';

import { cn } from '@/lib/utils';

interface UnreadBadgeProps {
  count: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

/**
 * Badge to show unread message count
 */
export function UnreadBadge({
  count,
  className,
  size = 'md',
  pulse = true,
}: UnreadBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > 99 ? '99+' : count.toString();

  const sizeClasses = {
    sm: 'h-4 min-w-4 text-[10px] px-1',
    md: 'h-5 min-w-5 text-xs px-1.5',
    lg: 'h-6 min-w-6 text-sm px-2',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-red-500 text-white font-medium',
        sizeClasses[size],
        pulse && 'animate-pulse',
        className
      )}
    >
      {displayCount}
    </span>
  );
}

/**
 * Dot indicator for unread messages (no count)
 */
export function UnreadDot({
  className,
  pulse = true,
}: {
  className?: string;
  pulse?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-block h-2.5 w-2.5 rounded-full bg-red-500',
        pulse && 'animate-pulse',
        className
      )}
    />
  );
}
