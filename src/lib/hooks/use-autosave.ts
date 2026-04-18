import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Status of the autosave operation
 */
export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Options for the useAutosave hook
 */
export interface UseAutosaveOptions {
  /**
   * Callback function to save data
   * Should return a Promise that resolves on success
   */
  onSave: () => Promise<void>;
  /**
   * Debounce delay in milliseconds
   * @default 500
   */
  delay?: number;
}

/**
 * Return value of the useAutosave hook
 */
export interface UseAutosaveReturn {
  /**
   * Current status of the autosave operation
   */
  status: AutosaveStatus;
  /**
   * Trigger a save operation
   */
  trigger: () => void;
  /**
   * Reset the status to idle
   */
  reset: () => void;
}

/**
 * Custom hook for debounced autosave functionality with retry logic
 *
 * Features:
 * - Debounces save operations by the specified delay (default 500ms)
 * - Exposes current save status: 'idle' | 'saving' | 'saved' | 'error'
 * - Retries once after 2 seconds on failure
 * - Emits 'error' status after retry failure for toast display
 *
 * @example
 * ```tsx
 * const { status, trigger } = useAutosave({
 *   onSave: async () => {
 *     await supabase.from('pages').update({ content }).eq('id', pageId);
 *   },
 *   delay: 500,
 * });
 *
 * // Trigger autosave when content changes
 * useEffect(() => {
 *   if (content) {
 *     trigger();
 *   }
 * }, [content, trigger]);
 *
 * // Display status
 * {status === 'saving' && <span>Saving...</span>}
 * {status === 'saved' && <span>Saved</span>}
 * {status === 'error' && <span>Save failed</span>}
 * ```
 */
export function useAutosave({
  onSave,
  delay = 500,
}: UseAutosaveOptions): UseAutosaveReturn {
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  /**
   * Execute the save operation with retry logic
   */
  const executeSave = useCallback(async () => {
    if (!isMountedRef.current) return;

    setStatus('saving');

    try {
      await onSave();
      if (!isMountedRef.current) return;

      // Success - reset retry count and set saved status
      retryCountRef.current = 0;
      setStatus('saved');
    } catch (error) {
      if (!isMountedRef.current) return;

      // Check if we should retry
      if (retryCountRef.current === 0) {
        // First failure - schedule retry after 2 seconds
        retryCountRef.current = 1;
        retryTimerRef.current = setTimeout(() => {
          if (!isMountedRef.current) return;
          executeSave();
        }, 2000);
      } else {
        // Second failure - emit error status and reset retry count
        retryCountRef.current = 0;
        setStatus('error');
      }
    }
  }, [onSave]);

  /**
   * Trigger a save operation (debounced)
   */
  const trigger = useCallback(() => {
    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Clear any pending retry timer
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    // Reset retry count when new trigger is called
    retryCountRef.current = 0;

    // Set status to idle while debouncing
    if (status !== 'idle') {
      setStatus('idle');
    }

    // Schedule the save operation
    debounceTimerRef.current = setTimeout(() => {
      executeSave();
    }, delay);
  }, [delay, executeSave, status]);

  /**
   * Reset the status to idle
   */
  const reset = useCallback(() => {
    // Clear timers
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
    }

    // Reset state
    retryCountRef.current = 0;
    setStatus('idle');
  }, []);

  return {
    status,
    trigger,
    reset,
  };
}
