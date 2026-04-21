'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageList } from '@/components/layout';
import { SortControl } from '@/components/ui';
import type { SortBy, SortDirection } from '@/components/ui';
import type { Page } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { usePolling } from '@/lib/hooks/use-polling';

export interface PageListWrapperProps {
  pages: Page[];
  searchQuery?: string;
  labelId?: string;
}

/**
 * Client component wrapper for PageList
 * Allows server component to pass pages to client-side drag-and-drop component
 * Manages sort state and triggers refetch via URL search params
 * Implements 30-second polling to keep page list updated across devices
 */
export function PageListWrapper({
  pages: initialPages,
  searchQuery = '',
  labelId = '',
}: PageListWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Local state for pages - initialized from server props, updated by polling
  const [pages, setPages] = useState<Page[]>(initialPages);

  // Update local state when server props change (e.g., after navigation/refetch)
  useEffect(() => {
    setPages(initialPages);
  }, [initialPages]);

  // Initialize sort state from URL search params or defaults
  const [sortBy, setSortBy] = useState<SortBy>(
    (searchParams.get('sortBy') as SortBy) || 'sort_order'
  );
  const [direction, setDirection] = useState<SortDirection>(
    (searchParams.get('direction') as SortDirection) || 'asc'
  );

  // Polling callback: refetch pages metadata and merge with local state
  const pollPages = useCallback(async () => {
    try {
      const ascending = direction === 'asc';

      // Fetch only metadata needed for list view
      const { data, error } = await supabase
        .from('pages')
        .select('id, title, sort_order, updated_at')
        .order(sortBy, { ascending });

      if (error) {
        console.error('Failed to poll pages:', error);
        return;
      }

      if (!data) {
        return;
      }

      // Merge polled data with current state
      // Only trigger re-render if data has actually changed
      setPages((currentPages) => {
        // Check if any pages have been updated
        const hasChanges = data.some((polledPage) => {
          const currentPage = currentPages.find((p) => p.id === polledPage.id);
          if (!currentPage) {
            // New page exists in polled data
            return true;
          }
          // Check if updated_at timestamp has changed
          return polledPage.updated_at !== currentPage.updated_at;
        });

        // Also check if pages have been deleted
        const hasDeleted = currentPages.some(
          (currentPage) => !data.find((p) => p.id === currentPage.id)
        );

        // Only update state if there are changes
        if (hasChanges || hasDeleted) {
          // Merge polled metadata with existing content
          return data.map((polledPage) => {
            const existingPage = currentPages.find(
              (p) => p.id === polledPage.id
            );
            // Preserve full page data (content, etc.) but update metadata
            return existingPage
              ? { ...existingPage, ...polledPage }
              : (polledPage as Page);
          });
        }

        // No changes, return current state to avoid re-render
        return currentPages;
      });
    } catch (err) {
      console.error('Error polling pages:', err);
    }
  }, [supabase, sortBy, direction]);

  // Poll for page updates every 30 seconds
  usePolling(pollPages, {
    interval: 30000, // 30 seconds
    runOnMount: false, // Don't run immediately - we already have server data
  });

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
