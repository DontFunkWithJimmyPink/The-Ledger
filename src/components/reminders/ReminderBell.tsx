'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/Badge';

export interface ReminderBellProps {
  className?: string;
  initialCount?: number;
}

export function ReminderBell({
  className = '',
  initialCount = 0,
}: ReminderBellProps) {
  const [pendingCount, setPendingCount] = useState(initialCount);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Fetch initial count
    const fetchPendingCount = async () => {
      try {
        const { count, error } = await supabase
          .from('reminders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        if (error) {
          console.error('Failed to fetch pending reminders count:', error);
          return;
        }

        setPendingCount(count ?? 0);
      } catch (err) {
        console.error('Error fetching pending reminders:', err);
      }
    };

    fetchPendingCount();
  }, [supabase]);

  const handleClick = () => {
    router.push('/reminders');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`relative p-2 text-ink-900 hover:bg-cream-200 rounded-md transition-colors ${className}`}
      aria-label={`Reminders${pendingCount > 0 ? ` (${pendingCount} pending)` : ''}`}
    >
      <span className="text-xl">🔔</span>
      {pendingCount > 0 && (
        <span className="absolute -top-1 -right-1">
          <Badge color="red" className="min-w-[1.25rem] h-5 px-1.5 text-xs">
            {pendingCount}
          </Badge>
        </span>
      )}
    </button>
  );
}
