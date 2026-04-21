'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ReminderBell } from '@/components/reminders';
import toast from 'react-hot-toast';

export interface TopBarProps {
  className?: string;
  initialReminderCount?: number;
  onMenuClick?: () => void;
}

export function TopBar({
  className = '',
  initialReminderCount = 0,
  onMenuClick,
}: TopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize search query from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search effect
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Only trigger search on notebook page
    if (pathname !== '/notebook') {
      return;
    }

    // Set debounced timer (300ms)
    debounceTimerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (searchQuery.trim()) {
        params.set('q', searchQuery.trim());
      } else {
        params.delete('q');
      }

      // Preserve existing sort params
      const sortBy = searchParams.get('sortBy');
      const direction = searchParams.get('direction');
      if (sortBy) params.set('sortBy', sortBy);
      if (direction) params.set('direction', direction);

      // Preserve label filter param
      const labelId = searchParams.get('labelId');
      if (labelId) params.set('labelId', labelId);

      // Update URL to trigger server-side refetch
      const queryString = params.toString();
      router.push(`/notebook${queryString ? `?${queryString}` : ''}`);
    }, 300);

    // Cleanup timer on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, pathname, router, searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submit is handled by the debounced effect
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
      className={`flex items-center gap-2 sm:gap-4 h-16 px-3 sm:px-6 bg-cream-100 border-b border-leather-500 ${className}`}
    >
      {/* Hamburger Menu Button (Mobile Only) */}
      {onMenuClick && (
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 text-ink-900 hover:bg-cream-200 rounded-md transition-colors flex-shrink-0"
          aria-label="Open menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      )}

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex-1 sm:max-w-md">
        <input
          type="search"
          placeholder="Search pages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 sm:px-4 py-2 text-sm bg-cream-50 border border-leather-300 rounded-md focus:outline-none focus:ring-2 focus:ring-leather-500 focus:border-transparent font-sans text-ink-900 placeholder:text-ink-500"
          aria-label="Search pages"
        />
      </form>

      {/* Right Section: Reminder Bell + User Menu */}
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        {/* Reminder Bell */}
        <ReminderBell initialCount={initialReminderCount} />

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
