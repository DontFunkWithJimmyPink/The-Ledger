import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

  const variantStyles = {
    primary:
      'bg-leather-700 text-cream-50 hover:bg-leather-900 focus-visible:ring-leather-700',
    secondary:
      'bg-cream-200 text-ink-900 border border-leather-500 hover:bg-cream-100 focus-visible:ring-leather-500',
    ghost: 'text-ink-900 hover:bg-cream-100 focus-visible:ring-leather-500',
  };

  const combinedClassName =
    `${baseStyles} ${variantStyles[variant]} ${className}`.trim();

  return (
    <button className={combinedClassName} {...props}>
      {children}
    </button>
  );
}
