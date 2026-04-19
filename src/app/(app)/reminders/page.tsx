import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { RemindersList } from './RemindersList';

/**
 * Row returned by joining reminders with tasks and pages
 */
interface ReminderWithDetails {
  id: string;
  task_id: string | null;
  page_id: string | null;
  fire_at: string;
  status: string;
  task_text: string | null;
  page_title: string | null;
}

/**
 * Reminders View Page - Server Component
 *
 * Fetches all pending reminders ordered by fire_at.
 * Groups into "Upcoming" and "Overdue" (fire_at < now).
 * Renders task text, linked page title, fire_at time, and a Dismiss button per item.
 */
export default async function RemindersPage() {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login?next=/reminders');
  }

  // Fetch all pending reminders with related task and page data
  // We use a LEFT JOIN to get task text and page title
  const { data: remindersData, error: remindersError } = await supabase
    .from('reminders')
    .select(
      `
      id,
      task_id,
      page_id,
      fire_at,
      status,
      tasks (
        text
      ),
      pages (
        title
      )
    `
    )
    .eq('status', 'pending')
    .order('fire_at', { ascending: true });

  if (remindersError) {
    console.error('Failed to fetch reminders:', remindersError);
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-ink-500 text-lg">
          Unable to load your reminders. Please try refreshing the page.
        </p>
      </div>
    );
  }

  // Transform the data to flatten the nested structure
  const reminders: ReminderWithDetails[] = (remindersData || []).map(
    (reminder: {
      id: string;
      task_id: string | null;
      page_id: string | null;
      fire_at: string;
      status: string;
      tasks?: { text: string } | null;
      pages?: { title: string } | null;
    }) => ({
      id: reminder.id,
      task_id: reminder.task_id,
      page_id: reminder.page_id,
      fire_at: reminder.fire_at,
      status: reminder.status,
      task_text: reminder.tasks?.text || null,
      page_title: reminder.pages?.title || null,
    })
  );

  // Get current time for categorization
  const now = new Date().toISOString();

  // Group reminders into overdue and upcoming
  const overdue = reminders.filter((r) => r.fire_at < now);
  const upcoming = reminders.filter((r) => r.fire_at >= now);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-serif font-bold text-ink-900">
          Reminders
        </h1>
        <p className="mt-2 text-ink-500">
          Manage your pending reminders and tasks
        </p>
      </div>

      {/* Reminders List */}
      {reminders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-ink-500 text-lg">
            No pending reminders — you&apos;re all caught up!
          </p>
        </div>
      ) : (
        <RemindersList overdue={overdue} upcoming={upcoming} />
      )}
    </div>
  );
}
