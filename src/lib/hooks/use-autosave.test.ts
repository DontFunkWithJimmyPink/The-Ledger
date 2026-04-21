import { renderHook, act, waitFor } from '@testing-library/react';
import { useAutosave } from './use-autosave';

// Mock timers
jest.useFakeTimers();

describe('useAutosave', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  describe('initialization', () => {
    it('should initialize with idle status', () => {
      const onSave = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useAutosave({ onSave }));

      expect(result.current.status).toBe('idle');
    });

    it('should accept custom delay parameter', () => {
      const onSave = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useAutosave({ onSave, delay: 1000 }));

      expect(result.current.status).toBe('idle');
    });
  });

  describe('debounce behavior', () => {
    it('should debounce save calls with default 500ms delay', async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useAutosave({ onSave }));

      act(() => {
        result.current.trigger();
      });

      // Should not call immediately
      expect(onSave).not.toHaveBeenCalled();
      expect(result.current.status).toBe('idle');

      // Fast-forward 400ms
      act(() => {
        jest.advanceTimersByTime(400);
      });

      // Still should not have called
      expect(onSave).not.toHaveBeenCalled();

      // Fast-forward remaining 100ms
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Should now have called
      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
        expect(result.current.status).toBe('saving');
      });
    });

    it('should debounce save calls with custom delay', async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useAutosave({ onSave, delay: 1000 }));

      act(() => {
        result.current.trigger();
      });

      // Fast-forward 500ms
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should not have called yet
      expect(onSave).not.toHaveBeenCalled();

      // Fast-forward remaining 500ms
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should now have called
      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
      });
    });

    it('should reset debounce timer on subsequent triggers', async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useAutosave({ onSave }));

      act(() => {
        result.current.trigger();
      });

      // Fast-forward 400ms
      act(() => {
        jest.advanceTimersByTime(400);
      });

      // Trigger again, resetting the timer
      act(() => {
        result.current.trigger();
      });

      // Fast-forward another 400ms (total 800ms from first trigger)
      act(() => {
        jest.advanceTimersByTime(400);
      });

      // Should still not have called because timer was reset
      expect(onSave).not.toHaveBeenCalled();

      // Fast-forward final 100ms (500ms from second trigger)
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Should now have called once
      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('status management', () => {
    it('should transition from idle -> saving -> saved on success', async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useAutosave({ onSave }));

      expect(result.current.status).toBe('idle');

      act(() => {
        result.current.trigger();
      });

      expect(result.current.status).toBe('idle');

      // Fast-forward past debounce
      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(result.current.status).toBe('saving');
      });

      // Wait for promise to resolve
      await waitFor(() => {
        expect(result.current.status).toBe('saved');
      });
    });

    it('should maintain saved status after successful save', async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useAutosave({ onSave }));

      act(() => {
        result.current.trigger();
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(result.current.status).toBe('saved');
      });

      // Status should remain saved
      expect(result.current.status).toBe('saved');
    });
  });

  describe('retry logic', () => {
    it('should retry once after 2 seconds on first failure', async () => {
      const onSave = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAutosave({ onSave }));

      act(() => {
        result.current.trigger();
        jest.advanceTimersByTime(500); // Debounce
      });

      // Wait for first call to fail
      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
      });

      // Should still be saving (retry scheduled)
      expect(result.current.status).toBe('saving');

      // Fast-forward to retry (2 seconds)
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Wait for retry
      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(2);
      });

      // Should now be saved
      await waitFor(() => {
        expect(result.current.status).toBe('saved');
      });
    });

    it('should set error status after second failure', async () => {
      const onSave = jest.fn().mockRejectedValue(new Error('Network error'));
      const { result } = renderHook(() => useAutosave({ onSave }));

      act(() => {
        result.current.trigger();
        jest.advanceTimersByTime(500); // Debounce
      });

      // Wait for first call to fail
      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
      });

      // Fast-forward to retry
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Wait for retry to fail
      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(2);
      });

      // Should now be in error state
      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });
    });

    it('should reset retry count on new trigger', async () => {
      const onSave = jest
        .fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockRejectedValueOnce(new Error('Second error'))
        .mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAutosave({ onSave }));

      // First attempt
      act(() => {
        result.current.trigger();
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
      });

      // Trigger again before retry
      act(() => {
        result.current.trigger();
        jest.advanceTimersByTime(500);
      });

      // Should have called again (retry count reset)
      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(2);
      });

      // Wait for retry
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(3);
      });

      // Should be saved (third attempt succeeded)
      await waitFor(() => {
        expect(result.current.status).toBe('saved');
      });
    });
  });

  describe('reset functionality', () => {
    it('should reset status to idle', async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useAutosave({ onSave }));

      act(() => {
        result.current.trigger();
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(result.current.status).toBe('saved');
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe('idle');
    });

    it('should cancel pending debounce timer on reset', async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useAutosave({ onSave }));

      act(() => {
        result.current.trigger();
      });

      // Reset before debounce completes
      act(() => {
        result.current.reset();
      });

      // Fast-forward past original debounce time
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should not have called save
      expect(onSave).not.toHaveBeenCalled();
      expect(result.current.status).toBe('idle');
    });

    it('should cancel pending retry timer on reset', async () => {
      const onSave = jest.fn().mockRejectedValue(new Error('Error'));
      const { result } = renderHook(() => useAutosave({ onSave }));

      act(() => {
        result.current.trigger();
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
      });

      // Reset before retry
      act(() => {
        result.current.reset();
      });

      // Fast-forward past retry time
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Should not have retried
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(result.current.status).toBe('idle');
    });
  });

  describe('cleanup on unmount', () => {
    it('should clear timers on unmount', () => {
      const onSave = jest.fn().mockResolvedValue(undefined);
      const { result, unmount } = renderHook(() => useAutosave({ onSave }));

      act(() => {
        result.current.trigger();
      });

      unmount();

      // Fast-forward past debounce time
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should not have called save after unmount
      expect(onSave).not.toHaveBeenCalled();
    });

    it('should not update state after unmount', async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);
      const { result, unmount } = renderHook(() => useAutosave({ onSave }));

      act(() => {
        result.current.trigger();
        jest.advanceTimersByTime(500);
      });

      // Unmount before promise resolves
      unmount();

      // Fast-forward to allow promise to settle
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // No error should be thrown (state update prevented)
      expect(onSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('should handle multiple rapid triggers correctly', async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useAutosave({ onSave }));

      // Trigger multiple times rapidly
      act(() => {
        result.current.trigger();
        result.current.trigger();
        result.current.trigger();
      });

      // Fast-forward past debounce
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should only call once
      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle save promise that never resolves', () => {
      const onSave = jest.fn().mockImplementation(() => new Promise(() => {}));
      const { result } = renderHook(() => useAutosave({ onSave }));

      act(() => {
        result.current.trigger();
        jest.advanceTimersByTime(500);
      });

      expect(result.current.status).toBe('saving');

      // Reset should work even with pending promise
      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe('idle');
    });

    it('should allow triggering new save while previous is in progress', async () => {
      let resolveFirst: (() => void) | undefined;
      const firstPromise = new Promise<void>((resolve) => {
        resolveFirst = resolve;
      });

      const onSave = jest
        .fn()
        .mockReturnValueOnce(firstPromise)
        .mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAutosave({ onSave }));

      // First trigger
      act(() => {
        result.current.trigger();
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(result.current.status).toBe('saving');
      });

      // Trigger again while first is in progress
      act(() => {
        result.current.trigger();
      });

      // Status should reset to idle when trigger is called
      expect(result.current.status).toBe('idle');

      // Advance timer to start the new save
      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(result.current.status).toBe('saving');
      });

      // Resolve first promise (should not affect current state)
      act(() => {
        resolveFirst!();
      });

      // Second save should complete
      await waitFor(() => {
        expect(result.current.status).toBe('saved');
      });
    });
  });

  describe('jitter functionality', () => {
    beforeEach(() => {
      // Mock Math.random for deterministic tests
      jest.spyOn(Math, 'random');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should use exact delay when jitter is 0 (default)', async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useAutosave({ onSave, delay: 500 }));

      act(() => {
        result.current.trigger();
      });

      // Should not fire before 500ms
      act(() => {
        jest.advanceTimersByTime(499);
      });
      expect(onSave).not.toHaveBeenCalled();

      // Should fire at exactly 500ms
      act(() => {
        jest.advanceTimersByTime(1);
      });

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
      });
    });

    it('should apply positive jitter correctly', async () => {
      // Mock Math.random to return 0.75 (will add +25ms to a 100ms jitter)
      (Math.random as jest.Mock).mockReturnValue(0.75);

      const onSave = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useAutosave({ onSave, delay: 500, jitter: 100 })
      );

      act(() => {
        result.current.trigger();
      });

      // Calculate expected delay: 500 + (0.75 - 0.5) * 100 = 500 + 25 = 525ms
      act(() => {
        jest.advanceTimersByTime(524);
      });
      expect(onSave).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1);
      });

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
      });
    });

    it('should apply negative jitter correctly', async () => {
      // Mock Math.random to return 0.25 (will subtract 25ms from a 100ms jitter)
      (Math.random as jest.Mock).mockReturnValue(0.25);

      const onSave = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useAutosave({ onSave, delay: 500, jitter: 100 })
      );

      act(() => {
        result.current.trigger();
      });

      // Calculate expected delay: 500 + (0.25 - 0.5) * 100 = 500 - 25 = 475ms
      act(() => {
        jest.advanceTimersByTime(474);
      });
      expect(onSave).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1);
      });

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
      });
    });

    it('should ensure final delay is never negative', async () => {
      // Mock Math.random to return 0 (maximum negative jitter)
      (Math.random as jest.Mock).mockReturnValue(0);

      const onSave = jest.fn().mockResolvedValue(undefined);
      // Use small delay with large jitter to test edge case
      const { result } = renderHook(() =>
        useAutosave({ onSave, delay: 10, jitter: 100 })
      );

      act(() => {
        result.current.trigger();
      });

      // Even with large negative jitter, delay should be at least 0
      // Expected: max(0, 10 + (0 - 0.5) * 100) = max(0, -40) = 0
      act(() => {
        jest.advanceTimersByTime(0);
      });

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
      });
    });

    it('should apply different jitter on each trigger', async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useAutosave({ onSave, delay: 500, jitter: 100 })
      );

      // First trigger with random = 0.75 (+25ms jitter)
      (Math.random as jest.Mock).mockReturnValueOnce(0.75);
      act(() => {
        result.current.trigger();
        jest.advanceTimersByTime(525);
      });

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
      });

      // Second trigger with random = 0.25 (-25ms jitter)
      (Math.random as jest.Mock).mockReturnValueOnce(0.25);
      act(() => {
        result.current.trigger();
        jest.advanceTimersByTime(475);
      });

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(2);
      });
    });

    it('should work correctly with custom delay and jitter values', async () => {
      // Mock Math.random to return 0.5 (no jitter adjustment)
      (Math.random as jest.Mock).mockReturnValue(0.5);

      const onSave = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useAutosave({ onSave, delay: 1000, jitter: 200 })
      );

      act(() => {
        result.current.trigger();
      });

      // Calculate expected delay: 1000 + (0.5 - 0.5) * 200 = 1000ms
      act(() => {
        jest.advanceTimersByTime(999);
      });
      expect(onSave).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1);
      });

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
      });
    });

    it('should prevent coordinated request storms with multiple concurrent instances', async () => {
      // Create three separate autosave instances with jitter
      const onSave1 = jest.fn().mockResolvedValue(undefined);
      const onSave2 = jest.fn().mockResolvedValue(undefined);
      const onSave3 = jest.fn().mockResolvedValue(undefined);

      // Mock different random values for each instance
      (Math.random as jest.Mock)
        .mockReturnValueOnce(0.25) // Instance 1: -25ms jitter (475ms total)
        .mockReturnValueOnce(0.5) // Instance 2: 0ms jitter (500ms total)
        .mockReturnValueOnce(0.75); // Instance 3: +25ms jitter (525ms total)

      const { result: result1 } = renderHook(() =>
        useAutosave({ onSave: onSave1, delay: 500, jitter: 100 })
      );
      const { result: result2 } = renderHook(() =>
        useAutosave({ onSave: onSave2, delay: 500, jitter: 100 })
      );
      const { result: result3 } = renderHook(() =>
        useAutosave({ onSave: onSave3, delay: 500, jitter: 100 })
      );

      // Trigger all three at the same time (simulating multiple open pages)
      act(() => {
        result1.current.trigger();
        result2.current.trigger();
        result3.current.trigger();
      });

      // At 474ms: no saves should have fired yet
      act(() => {
        jest.advanceTimersByTime(474);
      });
      expect(onSave1).not.toHaveBeenCalled();
      expect(onSave2).not.toHaveBeenCalled();
      expect(onSave3).not.toHaveBeenCalled();

      // At 475ms: first instance should fire
      act(() => {
        jest.advanceTimersByTime(1);
      });
      await waitFor(() => {
        expect(onSave1).toHaveBeenCalledTimes(1);
      });
      expect(onSave2).not.toHaveBeenCalled();
      expect(onSave3).not.toHaveBeenCalled();

      // At 500ms: second instance should fire
      act(() => {
        jest.advanceTimersByTime(25);
      });
      await waitFor(() => {
        expect(onSave2).toHaveBeenCalledTimes(1);
      });
      expect(onSave3).not.toHaveBeenCalled();

      // At 525ms: third instance should fire
      act(() => {
        jest.advanceTimersByTime(25);
      });
      await waitFor(() => {
        expect(onSave3).toHaveBeenCalledTimes(1);
      });

      // Verify all saves completed at different times (no coordinated storm)
      expect(onSave1).toHaveBeenCalledTimes(1);
      expect(onSave2).toHaveBeenCalledTimes(1);
      expect(onSave3).toHaveBeenCalledTimes(1);
    });
  });

  describe('manual retry', () => {
    it('should allow manual retry after error state', async () => {
      const onSave = jest
        .fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockRejectedValueOnce(new Error('Second error'))
        .mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAutosave({ onSave }));

      // Trigger autosave - will fail twice and enter error state
      act(() => {
        result.current.trigger();
        jest.advanceTimersByTime(500); // Debounce
      });

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
      });

      // Fast-forward to automatic retry
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(2);
        expect(result.current.status).toBe('error');
      });

      // Now manually retry
      act(() => {
        result.current.retry();
      });

      // Should immediately attempt save (no debounce)
      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(3);
        expect(result.current.status).toBe('saved');
      });
    });

    it('should reset retry count when using manual retry', async () => {
      const onSave = jest
        .fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockRejectedValueOnce(new Error('Second error'))
        .mockRejectedValueOnce(new Error('Third error'))
        .mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAutosave({ onSave }));

      // Trigger autosave - will fail twice and enter error state
      act(() => {
        result.current.trigger();
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
      });

      // Fast-forward to automatic retry
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(2);
        expect(result.current.status).toBe('error');
      });

      // Manual retry - resets retry count, so should retry once more if it fails
      act(() => {
        result.current.retry();
      });

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(3);
        expect(result.current.status).toBe('saving');
      });

      // Fast-forward for automatic retry after manual retry failure
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(4);
        expect(result.current.status).toBe('saved');
      });
    });

    it('should immediately execute save without debounce on manual retry', async () => {
      const onSave = jest
        .fn()
        .mockRejectedValueOnce(new Error('Error'))
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAutosave({ onSave, delay: 1000 }));

      // Trigger initial save
      act(() => {
        result.current.trigger();
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
      });

      // Fast-forward to automatic retry
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(2);
        expect(result.current.status).toBe('error');
      });

      // Manual retry should execute immediately (no 1000ms debounce)
      const callCount = onSave.mock.calls.length;
      act(() => {
        result.current.retry();
      });

      // Should have been called without advancing timers
      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(callCount + 1);
      });
    });

    it('should clear pending timers on manual retry', async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useAutosave({ onSave, delay: 1000 }));

      // Start a debounced save
      act(() => {
        result.current.trigger();
      });

      // Before debounce completes, call retry
      act(() => {
        result.current.retry();
      });

      // Should execute immediately
      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
      });

      // Advance past original debounce time - should not trigger again
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Still only one call
      expect(onSave).toHaveBeenCalledTimes(1);
    });
  });
});
