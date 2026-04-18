'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import type { Page } from '@/types';

export interface SortablePageListItemProps {
  page: Page;
  className?: string;
}

/**
 * Format a date as a relative time string (e.g., "2 days ago", "Just now")
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

  // For older dates, show formatted date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * SortablePageListItem Component
 *
 * Renders a single page item with:
 * - Drag handle via @dnd-kit/sortable
 * - Page title and last updated time
 * - Link to page editor
 * - Visual feedback during drag
 */
export function SortablePageListItem({
  page,
  className = '',
}: SortablePageListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: page.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-start gap-3 p-4 bg-cream-100 border border-leather-300 rounded-md
        ${isDragging ? 'shadow-lg' : ''}
        ${className}
      `}
    >
      {/* Drag Handle */}
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-leather-500 hover:text-leather-700 mt-1 flex-shrink-0"
        aria-label="Drag to reorder page"
        {...attributes}
        {...listeners}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="4" cy="4" r="1.5" />
          <circle cx="4" cy="8" r="1.5" />
          <circle cx="4" cy="12" r="1.5" />
          <circle cx="12" cy="4" r="1.5" />
          <circle cx="12" cy="8" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
        </svg>
      </button>

      {/* Page Link Content */}
      <Link
        href={`/notebook/${page.id}`}
        className="flex-1 min-w-0 hover:opacity-80 transition-opacity"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Page Title */}
            <h3 className="text-base font-semibold text-ink-900 font-sans truncate">
              {page.title || 'Untitled'}
            </h3>

            {/* Updated At */}
            <p className="mt-1 text-xs text-ink-500 font-sans">
              Updated {formatRelativeTime(page.updated_at)}
            </p>
          </div>

          {/* Visual indicator (chevron) */}
          <div className="flex-shrink-0 text-leather-500">
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </Link>
    </div>
  );
}
