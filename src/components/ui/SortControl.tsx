'use client';

import { useState, useRef, useEffect } from 'react';

export type SortBy = 'sort_order' | 'created_at' | 'updated_at' | 'title';
export type SortDirection = 'asc' | 'desc';

export interface SortControlProps {
  sortBy: SortBy;
  direction: SortDirection;
  onSortChange: (sortBy: SortBy, direction: SortDirection) => void;
}

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'sort_order', label: 'Custom Order' },
  { value: 'created_at', label: 'Date Created' },
  { value: 'updated_at', label: 'Date Updated' },
  { value: 'title', label: 'Title' },
];

/**
 * SortControl Component
 *
 * Dropdown control for sorting pages by different criteria.
 * Uses native select element styled with Tailwind for consistent UI.
 *
 * Features:
 * - Sort by: sort_order, created_at, updated_at, title
 * - Direction toggle: asc/desc
 * - Callback on change
 */
export function SortControl({
  sortBy,
  direction,
  onSortChange,
}: SortControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const currentLabel =
    SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label || 'Custom Order';

  const handleSortByChange = (newSortBy: SortBy) => {
    onSortChange(newSortBy, direction);
    setIsOpen(false);
  };

  const handleDirectionToggle = () => {
    const newDirection: SortDirection = direction === 'asc' ? 'desc' : 'asc';
    onSortChange(sortBy, newDirection);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Sort By Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-between px-3 py-2 text-sm font-medium text-ink-900 bg-cream-100 border border-leather-300 rounded-md hover:bg-cream-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-leather-500 transition-colors min-w-[160px]"
          aria-label="Sort by"
          aria-expanded={isOpen}
        >
          <span className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-leather-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
              />
            </svg>
            {currentLabel}
          </span>
          <svg
            className={`w-4 h-4 ml-2 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
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
          <div className="absolute z-10 mt-2 w-full bg-cream-50 border border-leather-300 rounded-md shadow-lg">
            <div className="py-1" role="menu" aria-orientation="vertical">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSortByChange(option.value)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-cream-100 transition-colors ${
                    sortBy === option.value
                      ? 'bg-cream-100 text-leather-900 font-medium'
                      : 'text-ink-900'
                  }`}
                  role="menuitem"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Direction Toggle Button */}
      <button
        onClick={handleDirectionToggle}
        className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-ink-900 bg-cream-100 border border-leather-300 rounded-md hover:bg-cream-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-leather-500 transition-colors"
        aria-label={`Sort direction: ${direction === 'asc' ? 'ascending' : 'descending'}`}
        title={direction === 'asc' ? 'Sort ascending' : 'Sort descending'}
      >
        {direction === 'asc' ? (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
        ) : (
          <svg
            className="w-5 h-5"
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
        )}
      </button>
    </div>
  );
}
