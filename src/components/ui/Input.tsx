import type { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId =
    id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const baseStyles =
    'w-full px-3 py-2 text-sm font-sans bg-cream-200 text-ink-900 border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';

  const stateStyles = error
    ? 'border-red-500 focus:ring-red-500'
    : 'border-leather-500 focus:ring-leather-700';

  const combinedClassName = `${baseStyles} ${stateStyles} ${className}`.trim();

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-sans font-medium text-ink-900"
        >
          {label}
        </label>
      )}
      <input id={inputId} className={combinedClassName} {...props} />
      {error && (
        <span className="text-sm font-sans text-red-600" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
