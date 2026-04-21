'use client';

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
import { SortablePageListItem } from './SortablePageListItem';
import type { Page } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { generateKeyBetween } from '@/lib/utils/fractional-index';
import { useState } from 'react';

export interface PageListProps {
  pages: Page[];
  onPagesReorder?: (pages: Page[]) => void;
}

/**
 * PageList Component
 *
 * Sortable container for page items using @dnd-kit.
 * Provides drag-and-drop reordering with fractional indexing for sort_order.
 *
 * Features:
 * - Vertical drag-and-drop reordering
 * - Touch support via PointerSensor with 8px activation constraint
 * - Automatic sort_order calculation using fractional indexing
 * - Supabase persistence on drag end
 * - Optional callback for parent component updates
 */
export function PageList({ pages, onPagesReorder }: PageListProps) {
  const [localPages, setLocalPages] = useState<Page[]>(pages);
  const supabase = createClient();

  // Configure sensors for drag-and-drop
  // PointerSensor with 8px activation distance for better touch support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to activate drag
      },
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localPages.findIndex((page) => page.id === active.id);
    const newIndex = localPages.findIndex((page) => page.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Optimistically update local state
    const reorderedPages = arrayMove(localPages, oldIndex, newIndex);
    setLocalPages(reorderedPages);

    // Calculate new sort_order using fractional indexing
    const pageToMove = localPages[oldIndex];
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
        setLocalPages(pages);
        return;
      }

      // Update the page with new sort_order
      const updatedPages = reorderedPages.map((page) =>
        page.id === pageToMove.id ? { ...page, sort_order: newSortOrder } : page
      );

      setLocalPages(updatedPages);

      // Notify parent component if callback provided
      if (onPagesReorder) {
        onPagesReorder(updatedPages);
      }
    } catch (err) {
      console.error('Failed to update page sort order:', err);
      // Revert optimistic update on error
      setLocalPages(pages);
    }
  };

  // Update local state when pages prop changes
  // This ensures the component stays in sync with parent updates
  if (pages !== localPages && pages.length !== localPages.length) {
    setLocalPages(pages);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={localPages.map((page) => page.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className="space-y-3"
          role="list"
          aria-label="Page list"
          style={{ touchAction: 'none' }}
        >
          {localPages.map((page) => (
            <SortablePageListItem key={page.id} page={page} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
