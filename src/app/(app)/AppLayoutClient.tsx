'use client';

import { useState } from 'react';
import { Sidebar, TopBar } from '@/components/layout';

export interface AppLayoutClientProps {
  children: React.ReactNode;
  initialReminderCount: number;
}

export function AppLayoutClient({
  children,
  initialReminderCount,
}: AppLayoutClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleOpenSidebar = () => {
    setIsSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-cream-50">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Bar */}
        <TopBar
          initialReminderCount={initialReminderCount}
          onMenuClick={handleOpenSidebar}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
