'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';

export interface TaskDueDatePickerProps {
  taskId: string;
  currentDueAt: string | null;
  onUpdate?: (dueAt: string) => void;
}

/**
 * TaskDueDatePicker Component
 *
 * Inline date+time picker wrapped in a Tooltip popover.
 * On confirm:
 * - Updates tasks.due_at via Supabase
 * - Inserts a reminder row in reminders table
 */
export function TaskDueDatePicker({
  taskId,
  currentDueAt,
  onUpdate,
}: TaskDueDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dateTimeValue, setDateTimeValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Close popover when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setError(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Convert ISO 8601 to datetime-local format (YYYY-MM-DDTHH:mm)
  const formatForInput = (isoString: string | null): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    // Get local datetime in format: YYYY-MM-DDTHH:mm
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleOpenPicker = () => {
    setDateTimeValue(formatForInput(currentDueAt));
    setError(null);
    setIsOpen(true);
  };

  const handleConfirm = async () => {
    if (!dateTimeValue) {
      setError('Please select a date and time');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Convert datetime-local value to ISO 8601 timestamp
      const dueDate = new Date(dateTimeValue).toISOString();

      // Update task due_at
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ due_at: dueDate })
        .eq('id', taskId);

      if (taskError) {
        console.error('Failed to update task due date:', taskError);
        setError('Failed to update due date');
        setIsSaving(false);
        return;
      }

      // Get current user ID for reminder
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('Failed to get user:', userError);
        setError('Failed to create reminder');
        setIsSaving(false);
        return;
      }

      // Insert reminder
      const { error: reminderError } = await supabase.from('reminders').insert({
        user_id: user.id,
        task_id: taskId,
        fire_at: dueDate,
        status: 'pending',
      });

      if (reminderError) {
        console.error('Failed to create reminder:', reminderError);
        // Don't show error to user - task update succeeded, which is primary goal
      }

      // Notify parent of successful update
      if (onUpdate) {
        onUpdate(dueDate);
      }

      setIsOpen(false);
    } catch (err) {
      console.error('Failed to set due date:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Clear task due_at
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ due_at: null })
        .eq('id', taskId);

      if (taskError) {
        console.error('Failed to clear task due date:', taskError);
        setError('Failed to clear due date');
        setIsSaving(false);
        return;
      }

      // Dismiss any pending reminders for this task
      const { error: reminderError } = await supabase
        .from('reminders')
        .update({ status: 'dismissed' })
        .eq('task_id', taskId)
        .eq('status', 'pending');

      if (reminderError) {
        console.error('Failed to dismiss reminders:', reminderError);
        // Don't show error - task update succeeded
      }

      // Notify parent of successful update
      if (onUpdate) {
        onUpdate('');
      }

      setIsOpen(false);
    } catch (err) {
      console.error('Failed to clear due date:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative inline-flex" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleOpenPicker}
        className="text-leather-500 hover:text-leather-700 transition-colors focus:outline-none focus:ring-2 focus:ring-leather-500 rounded"
        aria-label="Set due date and time"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <rect x="2" y="3" width="12" height="11" rx="1" />
          <line x1="2" y1="6" x2="14" y2="6" />
          <line x1="5" y1="1" x2="5" y2="5" />
          <line x1="11" y1="1" x2="11" y2="5" />
        </svg>
      </button>

      {/* Popover */}
      {isOpen && (
        <div
          className="absolute z-50 top-full mt-2 left-0 min-w-[280px] p-4 bg-cream-50 border border-leather-300 rounded-md shadow-lg"
          role="dialog"
          aria-label="Set due date"
        >
          <div className="flex flex-col gap-3">
            <label
              htmlFor={`due-date-${taskId}`}
              className="text-sm font-medium text-ink-900"
            >
              Due Date & Time
            </label>

            <input
              id={`due-date-${taskId}`}
              type="datetime-local"
              value={dateTimeValue}
              onChange={(e) => setDateTimeValue(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-cream-200 text-ink-900 border border-leather-500 rounded-md focus:outline-none focus:ring-2 focus:ring-leather-700"
              disabled={isSaving}
            />

            {error && (
              <p className="text-xs text-red-600" role="alert">
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={handleConfirm}
                disabled={isSaving}
                className="flex-1 text-xs py-1.5"
              >
                {isSaving ? 'Saving...' : 'Confirm'}
              </Button>

              {currentDueAt && (
                <Button
                  variant="secondary"
                  onClick={handleClear}
                  disabled={isSaving}
                  className="flex-1 text-xs py-1.5"
                >
                  Clear
                </Button>
              )}

              <Button
                variant="ghost"
                onClick={() => {
                  setIsOpen(false);
                  setError(null);
                }}
                disabled={isSaving}
                className="text-xs py-1.5 px-3"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
