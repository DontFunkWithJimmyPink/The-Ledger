import { Sidebar, TopBar } from '@/components/layout';
import { ReminderPoller } from '@/components/reminders';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-cream-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Bar */}
        <TopBar />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {/* ReminderPoller - polls for due reminders app-wide */}
      <ReminderPoller />
    </div>
  );
}
