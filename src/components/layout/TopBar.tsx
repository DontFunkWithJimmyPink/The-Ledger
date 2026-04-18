'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui';
import toast from 'react-hot-toast';

export interface TopBarProps {
  className?: string;
}

export function TopBar({ className = '' }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder for search functionality
    if (searchQuery.trim()) {
      toast('Search functionality coming soon', { icon: '🔍' });
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error('Failed to sign out');
      return;
    }

    router.push('/login');
    router.refresh();
  };

  return (
    <header
      className={`flex items-center justify-between h-16 px-6 bg-cream-100 border-b border-leather-500 ${className}`}
    >
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
        <input
          type="search"
          placeholder="Search pages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 text-sm bg-cream-50 border border-leather-300 rounded-md focus:outline-none focus:ring-2 focus:ring-leather-500 focus:border-transparent font-sans text-ink-900 placeholder:text-ink-500"
          aria-label="Search pages"
        />
      </form>

      {/* Right Section: Reminder Bell + User Menu */}
      <div className="flex items-center gap-4">
        {/* Reminder Bell Placeholder */}
        <button
          type="button"
          className="relative p-2 text-ink-900 hover:bg-cream-200 rounded-md transition-colors"
          aria-label="Reminders"
          title="Reminders coming soon"
        >
          <span className="text-xl">🔔</span>
          {/* Badge placeholder for reminder count */}
          <span className="sr-only">Reminders</span>
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-2 text-ink-900 hover:bg-cream-200 rounded-md transition-colors"
            aria-label="User menu"
            aria-expanded={showUserMenu}
            aria-haspopup="true"
          >
            <span className="text-xl">👤</span>
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              />

              {/* Menu */}
              <div className="absolute right-0 mt-2 w-48 bg-cream-100 border border-leather-500 rounded-md shadow-lg z-20">
                <div className="py-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-ink-900 hover:bg-cream-200 font-sans transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
