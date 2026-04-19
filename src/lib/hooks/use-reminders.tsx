import { useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { usePolling } from './use-polling';

/**
 * Row returned by the get_due_reminders() RPC function
 */
interface DueReminder {
  id: string; // uuid
  task_id: string | null; // uuid or null
  page_id: string | null; // uuid or null
  fire_at: string; // timestamptz (ISO 8601)
  task_text: string | null; // text from tasks.text or null
  page_title: string | null; // text from pages.title or null
}

/**
 * Custom hook that polls for due reminders and displays toast notifications
 *
 * Features:
 * - Uses usePolling at 30-second interval to check for due reminders
 * - Calls the get_due_reminders() RPC function
 * - Displays a toast notification for each due reminder with task/page text
 * - Provides a "Dismiss" action that updates the reminder status to 'dismissed'
 * - Tracks which reminders have been shown to avoid duplicate notifications
 *
 * @example
 * ```tsx
 * function App() {
 *   useReminders();
 *   return <div>...</div>;
 * }
 * ```
 */
export function useReminders(): void {
  const supabase = createClient();

  // Track which reminders have already been shown to prevent duplicate toasts
  const shownRemindersRef = useRef<Set<string>>(new Set());

  const checkReminders = useCallback(async () => {
    try {
      // Call the get_due_reminders RPC function
      const { data, error } = await supabase.rpc('get_due_reminders');

      if (error) {
        console.error('Failed to fetch due reminders:', error);
        return;
      }

      if (!data || data.length === 0) {
        return;
      }

      // Process each due reminder
      const reminders = data as DueReminder[];

      reminders.forEach((reminder) => {
        // Skip if we've already shown this reminder
        if (shownRemindersRef.current.has(reminder.id)) {
          return;
        }

        // Mark as shown
        shownRemindersRef.current.add(reminder.id);

        // Determine the text to display in the notification
        const displayText =
          reminder.task_text || reminder.page_title || 'Reminder';

        // Show custom toast with dismiss button
        toast.custom(
          (t) => (
            <div
              className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
              } max-w-md w-full bg-cream-100 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-leather-500 ring-opacity-50`}
            >
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <span className="text-2xl">🔔</span>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-ink-900">Reminder</p>
                    <p className="mt-1 text-sm text-ink-700">{displayText}</p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-leather-300">
                <button
                  onClick={async () => {
                    // Dismiss the toast
                    toast.dismiss(t.id);

                    // Update reminder status in database
                    const { error: updateError } = await supabase
                      .from('reminders')
                      .update({ status: 'dismissed' })
                      .eq('id', reminder.id);

                    if (updateError) {
                      console.error('Failed to dismiss reminder:', updateError);
                      toast.error('Failed to dismiss reminder');
                    }
                  }}
                  className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-leather-700 hover:text-leather-900 focus:outline-none focus:ring-2 focus:ring-leather-500"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ),
          {
            id: reminder.id,
            duration: Infinity,
          }
        );
      });
    } catch (err) {
      console.error('Error checking reminders:', err);
    }
  }, [supabase]);

  // Poll for reminders every 30 seconds
  usePolling(checkReminders, {
    interval: 30000, // 30 seconds
    runOnMount: true, // Check immediately on mount
  });
}
