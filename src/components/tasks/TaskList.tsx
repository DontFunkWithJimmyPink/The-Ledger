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
import { TaskItem } from './TaskItem';
import type { Task } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { generateKeyBetween } from '@/lib/utils/fractional-index';
import { useState } from 'react';

export interface TaskListProps {
  tasks: Task[];
  onTasksReorder?: (tasks: Task[]) => void;
}

/**
 * TaskList Component
 *
 * Sortable container for TaskItem components using @dnd-kit.
 * Provides drag-and-drop reordering with fractional indexing for sort_order.
 *
 * Features:
 * - Vertical drag-and-drop reordering
 * - Touch support via PointerSensor with 8px activation constraint
 * - Automatic sort_order calculation using fractional indexing
 * - Supabase persistence on drag end
 * - Optional callback for parent component updates
 */
export function TaskList({ tasks, onTasksReorder }: TaskListProps) {
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
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

    const oldIndex = localTasks.findIndex((task) => task.id === active.id);
    const newIndex = localTasks.findIndex((task) => task.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Optimistically update local state
    const reorderedTasks = arrayMove(localTasks, oldIndex, newIndex);
    setLocalTasks(reorderedTasks);

    // Calculate new sort_order using fractional indexing
    const taskToMove = localTasks[oldIndex];
    let newSortOrder: string;

    if (newIndex === 0) {
      // Moving to the beginning
      const nextTask = reorderedTasks[1];
      newSortOrder = generateKeyBetween(null, nextTask?.sort_order);
    } else if (newIndex === reorderedTasks.length - 1) {
      // Moving to the end
      const prevTask = reorderedTasks[newIndex - 1];
      newSortOrder = generateKeyBetween(prevTask.sort_order, null);
    } else {
      // Moving between two tasks
      const prevTask = reorderedTasks[newIndex - 1];
      const nextTask = reorderedTasks[newIndex + 1];
      newSortOrder = generateKeyBetween(
        prevTask.sort_order,
        nextTask.sort_order
      );
    }

    // Update Supabase
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ sort_order: newSortOrder })
        .eq('id', taskToMove.id);

      if (error) {
        console.error('Failed to update task sort order:', error);
        // Revert optimistic update on error
        setLocalTasks(tasks);
        return;
      }

      // Update the task with new sort_order
      const updatedTasks = reorderedTasks.map((task) =>
        task.id === taskToMove.id ? { ...task, sort_order: newSortOrder } : task
      );

      setLocalTasks(updatedTasks);

      // Notify parent component if callback provided
      if (onTasksReorder) {
        onTasksReorder(updatedTasks);
      }
    } catch (err) {
      console.error('Failed to update task sort order:', err);
      // Revert optimistic update on error
      setLocalTasks(tasks);
    }
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    setLocalTasks((prev) =>
      prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
  };

  // Update local state when tasks prop changes
  // This ensures the component stays in sync with parent updates
  if (tasks !== localTasks && tasks.length !== localTasks.length) {
    setLocalTasks(tasks);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={localTasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className="space-y-2"
          role="list"
          aria-label="Task list"
          style={{ touchAction: 'none' }}
        >
          {localTasks.map((task) => (
            <TaskItem key={task.id} task={task} onUpdate={handleTaskUpdate} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
