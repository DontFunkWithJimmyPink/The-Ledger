import { useEffect, useRef } from 'react';

/**
 * Options for the usePolling hook
 */
export interface UsePollingOptions {
  /**
   * The interval in milliseconds at which to call the callback
   * Defaults to NEXT_PUBLIC_POLL_INTERVAL_MS environment variable or 30000ms
   */
  interval?: number;
  /**
   * Whether to run the callback immediately on mount before starting the interval
   * Defaults to false
   */
  runOnMount?: boolean;
}

/**
 * Generic polling hook that runs a callback at regular intervals
 *
 * Features:
 * - Runs setInterval to call the callback periodically
 * - Pauses polling when the page is hidden (document.hidden)
 * - Resumes polling when the page becomes visible again
 * - Cleans up interval and event listeners on unmount
 *
 * @param callback - The function to call at each interval
 * @param options - Configuration options for polling behavior
 *
 * @example
 * ```tsx
 * usePolling(async () => {
 *   await fetchLatestData();
 * }, { interval: 5000, runOnMount: true });
 * ```
 */
export function usePolling(
  callback: () => void | Promise<void>,
  options: UsePollingOptions = {}
): void {
  const {
    interval = Number(process.env.NEXT_PUBLIC_POLL_INTERVAL_MS) || 30000,
    runOnMount = false,
  } = options;

  // Use refs to store mutable values that don't need to trigger re-renders
  const callbackRef = useRef(callback);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const isPageVisibleRef = useRef(!document.hidden);

  // Update callback ref when callback changes
  // This allows the callback to change without restarting the interval
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // Run callback immediately on mount if requested
    if (runOnMount) {
      callbackRef.current();
    }

    // Function to start the polling interval
    const startPolling = () => {
      // Clear any existing interval before starting a new one
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }

      intervalIdRef.current = setInterval(() => {
        // Only run the callback if the page is visible
        if (isPageVisibleRef.current) {
          callbackRef.current();
        }
      }, interval);
    };

    // Function to stop the polling interval
    const stopPolling = () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };

    // Handle visibility change events
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      isPageVisibleRef.current = isVisible;

      if (isVisible) {
        // Resume polling when page becomes visible
        startPolling();
      } else {
        // Pause polling when page is hidden
        stopPolling();
      }
    };

    // Set initial visibility state
    isPageVisibleRef.current = !document.hidden;

    // Start polling if the page is currently visible
    if (isPageVisibleRef.current) {
      startPolling();
    }

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup function
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [interval, runOnMount]); // Re-run effect if interval or runOnMount changes
}
