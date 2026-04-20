import { Sidebar, TopBar } from '@/components/layout';
import { ReminderPoller } from '@/components/reminders';
import { createClient } from '@/lib/supabase/server';

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
    <div className="flex h-screen bg-cream-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Bar */}
        <TopBar initialReminderCount={initialReminderCount} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {/* ReminderPoller - polls for due reminders app-wide */}
      <ReminderPoller />
    </div>
  );
}
