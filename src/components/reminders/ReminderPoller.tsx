'use client';

import { useReminders } from '@/lib/hooks/use-reminders';

/**
 * ReminderPoller is a client component that mounts the useReminders hook
 * to poll for due reminders app-wide while the user is authenticated.
 *
 * This component should be rendered in the (app)/layout.tsx to ensure
 * it polls throughout the entire authenticated app session.
 *
 * The component itself doesn't render any visible UI - it just mounts
 * the useReminders hook which handles polling and displaying toast notifications.
 */
export function ReminderPoller() {
  useReminders();
  return null;
}
