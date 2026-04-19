'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui';

interface ReminderWithDetails {
  id: string;
  task_id: string | null;
  page_id: string | null;
  fire_at: string;
  status: string;
  task_text: string | null;
  page_title: string | null;
}

interface ReminderItemProps {
  reminder: ReminderWithDetails;
}

/**
 * ReminderItem - Client Component
 *
 * Displays a single reminder with:
 * - Task text or page title
 * - Fire time
 * - Link to the related page
 * - Dismiss button
 */
export function ReminderItem({ reminder }: ReminderItemProps) {
  const [isDismissing, setIsDismissing] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Format the fire_at timestamp
  const fireDate = new Date(reminder.fire_at);
  const formattedDate = fireDate.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // Determine display text
  const displayText = reminder.task_text || reminder.page_title || 'Reminder';

  // Determine the link target
  // If task_id exists, we need to get the page_id from the task
  // For now, we'll link to the page directly if page_id exists
  const linkTarget = reminder.page_id
    ? `/notebook/${reminder.page_id}`
    : '/notebook';

  const handleDismiss = async () => {
    setIsDismissing(true);

    try {
      const { error } = await supabase
        .from('reminders')
        .update({ status: 'dismissed' })
        .eq('id', reminder.id);

      if (error) {
        console.error('Failed to dismiss reminder:', error);
        toast.error('Failed to dismiss reminder');
        setIsDismissing(false);
        return;
      }

      setIsDismissed(true);
      toast.success('Reminder dismissed');

      // Refresh the page data to update the list
      router.refresh();
    } catch (err) {
      console.error('Error dismissing reminder:', err);
      toast.error('Failed to dismiss reminder');
      setIsDismissing(false);
    }
  };

  // Don't render if dismissed
  if (isDismissed) {
    return null;
  }

  return (
    <div className="bg-cream-100 border border-leather-300 rounded-lg p-4 flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        {/* Display Text */}
        <div className="mb-2">
          <Link
            href={linkTarget}
            className="text-ink-900 font-medium hover:text-leather-700 transition-colors"
          >
            {displayText}
          </Link>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-sm text-ink-500">
          <div className="flex items-center gap-1">
            <span>🕐</span>
            <time dateTime={reminder.fire_at}>{formattedDate}</time>
          </div>
          {reminder.page_title && reminder.task_text && (
            <div className="flex items-center gap-1">
              <span>📄</span>
              <span className="truncate">{reminder.page_title}</span>
            </div>
          )}
        </div>
      </div>

      {/* Dismiss Button */}
      <Button
        variant="secondary"
        onClick={handleDismiss}
        disabled={isDismissing}
        className="flex-shrink-0"
      >
        {isDismissing ? 'Dismissing...' : 'Dismiss'}
      </Button>
    </div>
  );
}
