import Link from 'next/link';
import type { Page } from '@/types';

export interface PageListItemProps {
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

export function PageListItem({ page, className = '' }: PageListItemProps) {
  return (
    <Link
      href={`/notebook/${page.id}`}
      className={`block p-4 bg-cream-100 border border-leather-300 rounded-md hover:bg-cream-200 hover:border-leather-500 transition-colors ${className}`}
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

        {/* Visual indicator (chevron or arrow) */}
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
  );
}
