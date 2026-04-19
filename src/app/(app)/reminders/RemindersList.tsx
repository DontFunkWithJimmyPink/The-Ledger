'use client';

import { ReminderItem } from './ReminderItem';

interface ReminderWithDetails {
  id: string;
  task_id: string | null;
  page_id: string | null;
  fire_at: string;
  status: string;
  task_text: string | null;
  page_title: string | null;
}

interface RemindersListProps {
  overdue: ReminderWithDetails[];
  upcoming: ReminderWithDetails[];
}

/**
 * RemindersList - Client Component
 *
 * Displays reminders grouped by Overdue and Upcoming.
 * Handles client-side state updates after dismissal.
 */
export function RemindersList({ overdue, upcoming }: RemindersListProps) {
  return (
    <div className="space-y-8">
      {/* Overdue Section */}
      {overdue.length > 0 && (
        <section>
          <h2 className="text-xl font-serif font-bold text-ink-900 mb-4">
            Overdue
          </h2>
          <div className="space-y-3">
            {overdue.map((reminder) => (
              <ReminderItem key={reminder.id} reminder={reminder} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Section */}
      {upcoming.length > 0 && (
        <section>
          <h2 className="text-xl font-serif font-bold text-ink-900 mb-4">
            Upcoming
          </h2>
          <div className="space-y-3">
            {upcoming.map((reminder) => (
              <ReminderItem key={reminder.id} reminder={reminder} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
