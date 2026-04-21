import { ReminderPoller } from '@/components/reminders';
import { createClient } from '@/lib/supabase/server';
import { AppLayoutClient } from './AppLayoutClient';

/**
 * App layout that wraps all authenticated pages
 * Fetches initial reminder count server-side and passes to TopBar/ReminderBell
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Fetch initial pending reminder count server-side for ReminderBell
  let initialReminderCount = 0;
  try {
    const { count, error } = await supabase
      .from('reminders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (!error && count !== null) {
      initialReminderCount = count;
    }
  } catch (err) {
    // Silent fail - client will fetch count on mount
    console.error('Failed to fetch initial reminder count:', err);
  }

  return (
    <>
      <AppLayoutClient initialReminderCount={initialReminderCount}>
        {children}
      </AppLayoutClient>
      {/* ReminderPoller - polls for due reminders app-wide */}
      <ReminderPoller />
    </>
  );
}
