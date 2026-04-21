'use client';

import { useState, useEffect } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { SidebarPageListItem } from './SidebarPageListItem';
import type { Page } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { generateKeyBetween } from '@/lib/utils/fractional-index';

/**
 * SidebarPageList Component
 *
 * Compact page list for sidebar with drag-and-drop reordering.
 * Fetches pages on mount and provides DnD functionality.
 *
 * Features:
 * - Fetches pages sorted by sort_order
 * - Vertical drag-and-drop reordering
 * - Touch support via PointerSensor
 * - Automatic sort_order calculation using fractional indexing
 * - Supabase persistence on drag end
 */
export function SidebarPageList() {
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  // Configure sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to activate drag
      },
    })
  );

  // Fetch pages on mount
  useEffect(() => {
    async function fetchPages() {
      try {
        const { data, error } = await supabase
          .from('pages')
          .select('id, title, content, sort_order, updated_at, created_at, notebook_id')
          .order('sort_order', { ascending: true });

        if (error) {
          console.error('Failed to fetch pages for sidebar:', error);
          return;
        }

        setPages(data || []);
      } catch (err) {
        console.error('Failed to fetch pages for sidebar:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPages();
  }, [supabase]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = pages.findIndex((page) => page.id === active.id);
    const newIndex = pages.findIndex((page) => page.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Optimistically update local state
    const reorderedPages = arrayMove(pages, oldIndex, newIndex);
    setPages(reorderedPages);

    // Calculate new sort_order using fractional indexing
    const pageToMove = pages[oldIndex];
    let newSortOrder: string;

    if (newIndex === 0) {
      // Moving to the beginning
      const nextPage = reorderedPages[1];
      newSortOrder = generateKeyBetween(null, nextPage?.sort_order);
    } else if (newIndex === reorderedPages.length - 1) {
      // Moving to the end
      const prevPage = reorderedPages[newIndex - 1];
      newSortOrder = generateKeyBetween(prevPage.sort_order, null);
    } else {
      // Moving between two pages
      const prevPage = reorderedPages[newIndex - 1];
      const nextPage = reorderedPages[newIndex + 1];
      newSortOrder = generateKeyBetween(
        prevPage.sort_order,
        nextPage.sort_order
      );
    }

    // Update Supabase
    try {
      const { error } = await supabase
        .from('pages')
        .update({ sort_order: newSortOrder })
        .eq('id', pageToMove.id);

      if (error) {
        console.error('Failed to update page sort order:', error);
        // Revert optimistic update on error
        setPages(pages);
        return;
      }

      // Update the page with new sort_order
      const updatedPages = reorderedPages.map((page) =>
        page.id === pageToMove.id ? { ...page, sort_order: newSortOrder } : page
      );

      setPages(updatedPages);
    } catch (err) {
      console.error('Failed to update page sort order:', err);
      // Revert optimistic update on error
      setPages(pages);
    }
  };

  if (isLoading) {
    return (
      <div className="px-2 py-3">
        <div className="animate-pulse space-y-2">
          <div className="h-8 bg-leather-700 rounded"></div>
          <div className="h-8 bg-leather-700 rounded"></div>
          <div className="h-8 bg-leather-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="px-2 py-3">
        <p className="text-xs text-cream-400 text-center">No pages yet</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={pages.map((page) => page.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1 px-2" role="list" aria-label="Pages">
          {pages.map((page) => (
            <SidebarPageListItem key={page.id} page={page} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
