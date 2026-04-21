'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageList } from '@/components/layout';
import { SortControl } from '@/components/ui';
import type { SortBy, SortDirection } from '@/components/ui';
import type { Page } from '@/types';

export interface PageListWrapperProps {
  pages: Page[];
  searchQuery?: string;
  labelId?: string;
}

/**
 * Client component wrapper for PageList
 * Allows server component to pass pages to client-side drag-and-drop component
 * Manages sort state and triggers refetch via URL search params
 */
export function PageListWrapper({
  pages,
  searchQuery = '',
  labelId = '',
}: PageListWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize sort state from URL search params or defaults
  const [sortBy, setSortBy] = useState<SortBy>(
    (searchParams.get('sortBy') as SortBy) || 'sort_order'
  );
  const [direction, setDirection] = useState<SortDirection>(
    (searchParams.get('direction') as SortDirection) || 'asc'
  );

  const handleSortChange = (newSortBy: SortBy, newDirection: SortDirection) => {
    setSortBy(newSortBy);
    setDirection(newDirection);

    // Update URL search params to trigger server-side refetch
    const params = new URLSearchParams();
    params.set('sortBy', newSortBy);
    params.set('direction', newDirection);

    // Preserve search query if present
    if (searchQuery) {
      params.set('q', searchQuery);
    }

    // Preserve label filter if present
    if (labelId) {
      params.set('labelId', labelId);
    }

    router.push(`/notebook?${params.toString()}`);
  };

  return (
    <div>
      {/* Sort Controls */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-500">
          {pages.length} {pages.length === 1 ? 'page' : 'pages'}
        </p>
        <SortControl
          sortBy={sortBy}
          direction={direction}
          onSortChange={handleSortChange}
        />
      </div>

      {/* Page List */}
      <PageList pages={pages} />
    </div>
  );
}
