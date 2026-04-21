'use client';

import { useEffect, useRef, useState } from 'react';

export interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

const AVAILABLE_COLORS = [
  { name: 'Leather', value: 'leather-300', bg: 'bg-leather-300' },
  { name: 'Dark Leather', value: 'leather-500', bg: 'bg-leather-500' },
  { name: 'Darker Leather', value: 'leather-700', bg: 'bg-leather-700' },
  { name: 'Cream', value: 'cream-200', bg: 'bg-cream-200' },
  { name: 'Red', value: 'red-100', bg: 'bg-red-100' },
  { name: 'Green', value: 'green-100', bg: 'bg-green-100' },
  { name: 'Blue', value: 'blue-100', bg: 'bg-blue-100' },
  { name: 'Amber', value: 'amber-100', bg: 'bg-amber-100' },
];

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedColor = AVAILABLE_COLORS.find((c) => c.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (color: string) => {
    onChange(color);
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-1" ref={containerRef}>
      {label && (
        <label className="text-sm font-sans font-medium text-ink-900">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 text-sm font-sans bg-cream-200 text-ink-900 border border-leather-500 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-leather-700"
          aria-label="Select color"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${selectedColor?.bg}`} />
            <span>{selectedColor?.name || 'Select color'}</span>
          </div>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-cream-50 border border-leather-500 rounded-md shadow-lg">
            <div className="p-2 grid grid-cols-4 gap-2">
              {AVAILABLE_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => handleSelect(color.value)}
                  className={`p-2 rounded hover:bg-cream-100 transition-colors ${
                    color.value === value ? 'ring-2 ring-leather-700' : ''
                  }`}
                  aria-label={color.name}
                  title={color.name}
                >
                  <div
                    className={`w-8 h-8 rounded ${color.bg} border border-leather-300`}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
