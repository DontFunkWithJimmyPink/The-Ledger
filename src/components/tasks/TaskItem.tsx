'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';

export interface TaskItemProps {
  task: Task;
  onUpdate?: (task: Task) => void;
}

/**
 * TaskItem Component
 *
 * Renders a single task item with:
 * - Checkbox that toggles checked state via Supabase update
 * - Auto-dismiss pending reminders when task is marked as complete
 * - Task text display
 * - Due date display area (if due_at exists)
 * - Drag handle via @dnd-kit/sortable
 * - Visual distinction for completed tasks (strikethrough + muted color)
 */
export function TaskItem({ task, onUpdate }: TaskItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const supabase = createClient();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleCheckboxChange = async () => {
    if (isUpdating) return;

    setIsUpdating(true);
    const newCheckedState = !task.checked;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ checked: newCheckedState })
        .eq('id', task.id);

      if (error) {
        console.error('Failed to update task:', error);
        return;
      }

      // Auto-dismiss pending reminders when task is marked as complete
      if (newCheckedState) {
        const { error: reminderError } = await supabase
          .from('reminders')
          .update({ status: 'dismissed' })
          .eq('task_id', task.id)
          .eq('status', 'pending');

        if (reminderError) {
          console.error('Failed to dismiss reminders:', reminderError);
          // Don't return - task was updated successfully, reminder dismissal is non-critical
        }
      }

      // Notify parent component of the update
      if (onUpdate) {
        onUpdate({ ...task, checked: newCheckedState });
      }
    } catch (err) {
      console.error('Failed to update task:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Check if task is overdue
  const now = new Date();
  const isOverdue = task.due_at && !task.checked && new Date(task.due_at) < now;

  // Calculate how long the task has been overdue
  const overdueHours = isOverdue && task.due_at
    ? (now.getTime() - new Date(task.due_at).getTime()) / (1000 * 60 * 60)
    : 0;

  // Use red for severely overdue (24+ hours), amber for recently overdue
  const isSeverelyOverdue = overdueHours >= 24;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-start gap-3 px-4 py-3 rounded-md border border-leather-300 bg-cream-50
        ${isDragging ? 'shadow-lg' : 'shadow-sm'}
        ${isSeverelyOverdue ? 'border-l-4 border-l-red-500' : isOverdue ? 'border-l-4 border-l-amber-500' : ''}
      `}
      role="listitem"
      aria-label={task.text}
    >
      {/* Drag Handle */}
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-leather-500 hover:text-leather-700 mt-1"
        aria-label="Drag to reorder task"
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

      {/* Checkbox */}
      <input
        type="checkbox"
        checked={task.checked}
        onChange={handleCheckboxChange}
        disabled={isUpdating}
        className="mt-1 w-4 h-4 rounded border-leather-500 text-leather-700 focus:ring-2 focus:ring-leather-500 focus:ring-offset-2 cursor-pointer disabled:opacity-50"
        aria-label={`Mark "${task.text}" as ${task.checked ? 'incomplete' : 'complete'}`}
      />

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        {/* Task Text */}
        <p
          className={`
            text-sm leading-relaxed
            ${task.checked ? 'line-through text-ink-500' : 'text-ink-900'}
          `}
        >
          {task.text}
        </p>

        {/* Due Date Display */}
        {task.due_at && (
          <div
            className={`
              mt-1 text-xs
              ${
                isSeverelyOverdue
                  ? 'text-red-700 font-medium'
                  : isOverdue && !task.checked
                    ? 'text-amber-700 font-medium'
                    : 'text-ink-500'
              }
            `}
          >
            Due: {formatDueDate(task.due_at)}
            {isOverdue && !task.checked && ' (Overdue)'}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Format due date for display
 * Returns a human-readable date string
 */
function formatDueDate(dueAt: string): string {
  const date = new Date(dueAt);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // If today
  if (diffDays === 0) {
    return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }

  // If tomorrow
  if (diffDays === 1) {
    return `Tomorrow at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }

  // If within a week
  if (diffDays > 0 && diffDays <= 7) {
    return `${date.toLocaleDateString('en-US', { weekday: 'long' })} at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }

  // Default: full date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: 'numeric',
    minute: '2-digit',
  });
}
