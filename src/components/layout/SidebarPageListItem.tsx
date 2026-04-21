'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Page } from '@/types';

export interface SidebarPageListItemProps {
  page: Page;
}

/**
 * SidebarPageListItem Component
 *
 * Compact sortable page item for sidebar navigation.
 * Features:
 * - Drag handle for reordering
 * - Active state highlighting
 * - Truncated title display
 * - Visual feedback during drag
 */
export function SidebarPageListItem({ page }: SidebarPageListItemProps) {
  const pathname = usePathname();
  const isActive = pathname === `/notebook/${page.id}`;

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
        flex items-center gap-2 rounded-md
        ${isDragging ? 'shadow-lg' : ''}
      `}
    >
      {/* Drag Handle */}
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-cream-400 hover:text-cream-200 flex-shrink-0 p-1"
        aria-label="Drag to reorder page"
        {...attributes}
        {...listeners}
      >
        <svg
          width="12"
          height="12"
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

      {/* Page Link */}
      <Link
        href={`/notebook/${page.id}`}
        className={`
          flex-1 min-w-0 px-3 py-2 rounded-md text-sm transition-colors
          ${
            isActive
              ? 'bg-leather-700 text-cream-50 font-medium'
              : 'text-cream-100 hover:bg-leather-700 hover:text-cream-50'
          }
        `}
      >
        <span className="truncate block">{page.title || 'Untitled'}</span>
      </Link>
    </div>
  );
}
