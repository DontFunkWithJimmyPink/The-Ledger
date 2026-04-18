'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Task } from '@/types';

export interface TaskItemProps {
  task: Task;
  onTaskUpdate?: (task: Task) => void;
}

/**
 * TaskItem - Individual task row with checkbox and drag handle
 *
 * Renders a checkbox that toggles the checked state, task text,
 * and due date display. Uses @dnd-kit/sortable for drag-and-drop reordering.
 *
 * Completed tasks are visually distinguished with strikethrough and muted color.
 *
 * @example
 * ```tsx
 * <TaskItem
 *   task={task}
 *   onTaskUpdate={(updatedTask) => console.log('Task updated', updatedTask)}
 * />
 * ```
 */
export function TaskItem({ task, onTaskUpdate }: TaskItemProps) {
  const [isChecked, setIsChecked] = useState(task.checked);
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleCheckboxChange = async (checked: boolean) => {
    setIsChecked(checked);
    setIsUpdating(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('tasks')
        .update({ checked })
        .eq('id', task.id);

      if (error) {
        console.error('Failed to update task checked state:', error);
        // Revert optimistic update
        setIsChecked(!checked);
      } else {
        // Notify parent of update
        onTaskUpdate?.({ ...task, checked });
      }
    } catch (err) {
      console.error('Failed to update task checked state:', err);
      // Revert optimistic update
      setIsChecked(!checked);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDueDate = (dueAt: string | null) => {
    if (!dueAt) return null;

    const date = new Date(dueAt);
    const now = new Date();
    const isOverdue = date < now && !isChecked;

    const formattedDate = date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });

    return (
      <span
        className={`ml-2 text-xs ${
          isOverdue ? 'text-red-600 font-medium' : 'text-ink-500'
        }`}
      >
        {isOverdue && '⚠️ '}
        {formattedDate}
      </span>
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 py-2 px-3 bg-cream-50 rounded hover:bg-cream-100 transition-colors"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-ink-500 hover:text-ink-900 p-1"
        aria-label="Drag to reorder"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 3.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm7-10a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {/* Checkbox */}
      <input
        type="checkbox"
        checked={isChecked}
        onChange={(e) => handleCheckboxChange(e.target.checked)}
        disabled={isUpdating}
        className="w-4 h-4 text-leather-700 bg-cream-50 border-ink-500 rounded focus:ring-leather-500 focus:ring-2 cursor-pointer disabled:opacity-50"
        aria-label={`Mark task "${task.text}" as ${isChecked ? 'incomplete' : 'complete'}`}
      />

      {/* Task text */}
      <span
        className={`flex-1 text-sm font-sans ${isChecked ? 'line-through text-ink-500' : 'text-ink-900'}`}
      >
        {task.text}
      </span>

      {/* Due date display */}
      {formatDueDate(task.due_at)}
    </div>
  );
}
