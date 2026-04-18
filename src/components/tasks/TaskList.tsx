'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useState } from 'react';
import { generateKeyBetween } from '@/lib/utils/fractional-index';
import { createClient } from '@/lib/supabase/client';
import type { Task } from '@/types';

export interface TaskListProps {
  tasks: Task[];
  pageId: string;
  onTasksReorder?: (tasks: Task[]) => void;
  children: React.ReactNode;
}

/**
 * TaskList - Standalone sortable container for tasks
 *
 * Wraps @dnd-kit DndContext + SortableContext for a vertical list of TaskItem components.
 * On drag end, calculates new sort_order using fractional indexing and updates the database.
 *
 * @example
 * ```tsx
 * <TaskList tasks={tasks} pageId={pageId}>
 *   {tasks.map((task) => (
 *     <TaskItem key={task.id} task={task} />
 *   ))}
 * </TaskList>
 * ```
 */
export function TaskList({
  tasks,
  pageId,
  onTasksReorder,
  children,
}: TaskListProps) {
  const [items, setItems] = useState(tasks);

  // Configure sensors for drag-and-drop
  // PointerSensor with activation constraint for touch support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Calculate new sort_order using fractional indexing
    let newSortOrder: string;

    if (newIndex === 0) {
      // Moving to the start
      newSortOrder = generateKeyBetween(null, items[0].sort_order);
    } else if (newIndex === items.length - 1) {
      // Moving to the end
      newSortOrder = generateKeyBetween(
        items[items.length - 1].sort_order,
        null
      );
    } else if (newIndex < oldIndex) {
      // Moving up - insert before target
      newSortOrder = generateKeyBetween(
        items[newIndex - 1]?.sort_order || null,
        items[newIndex].sort_order
      );
    } else {
      // Moving down - insert after target
      newSortOrder = generateKeyBetween(
        items[newIndex].sort_order,
        items[newIndex + 1]?.sort_order || null
      );
    }

    // Optimistically update local state
    const reorderedItems = [...items];
    const [movedItem] = reorderedItems.splice(oldIndex, 1);
    reorderedItems.splice(newIndex, 0, {
      ...movedItem,
      sort_order: newSortOrder,
    });

    setItems(reorderedItems);
    onTasksReorder?.(reorderedItems);

    // Update database
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('tasks')
        .update({ sort_order: newSortOrder })
        .eq('id', active.id)
        .eq('page_id', pageId);

      if (error) {
        console.error('Failed to update task sort order:', error);
        // Revert optimistic update on error
        setItems(items);
        onTasksReorder?.(items);
      }
    } catch (err) {
      console.error('Failed to update task sort order:', err);
      // Revert optimistic update on error
      setItems(items);
      onTasksReorder?.(items);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        {children}
      </SortableContext>
    </DndContext>
  );
}
