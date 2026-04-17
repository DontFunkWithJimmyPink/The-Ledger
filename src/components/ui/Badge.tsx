import type { ReactNode } from 'react';

export interface BadgeProps {
  children: ReactNode;
  color?: 'leather' | 'cream' | 'ink' | 'red' | 'green' | 'blue' | 'amber';
  className?: string;
}

export function Badge({
  children,
  color = 'leather',
  className = '',
}: BadgeProps) {
  const baseStyles =
    'inline-flex items-center px-2 py-1 text-xs font-sans font-medium rounded-full';

  const colorStyles = {
    leather: 'bg-leather-300 text-ink-900',
    cream: 'bg-cream-200 text-ink-900',
    ink: 'bg-ink-900 text-cream-50',
    red: 'bg-red-100 text-red-800',
    green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800',
    amber: 'bg-amber-100 text-amber-800',
  };

  const combinedClassName =
    `${baseStyles} ${colorStyles[color]} ${className}`.trim();

  return <span className={combinedClassName}>{children}</span>;
}
