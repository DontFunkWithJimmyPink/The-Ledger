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
});
