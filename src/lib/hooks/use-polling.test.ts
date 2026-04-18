import { renderHook, waitFor } from '@testing-library/react';
import { usePolling } from './use-polling';

// Mock timers for testing
jest.useFakeTimers();

describe('usePolling', () => {
  const originalEnv = process.env;
  let mockCallback: jest.Mock;

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = { ...originalEnv };

    // Create a mock callback
    mockCallback = jest.fn();

    // Mock document.hidden as false (page visible) by default
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    });

    // Clear all timers and mocks
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;

    // Run any pending timers to clean up
    jest.runOnlyPendingTimers();
  });

  describe('Basic polling behavior', () => {
    it('should call callback at specified interval', () => {
      const { unmount } = renderHook(() =>
        usePolling(mockCallback, { interval: 1000 })
      );

      // Initially, callback should not be called (runOnMount is false by default)
      expect(mockCallback).not.toHaveBeenCalled();

      // Fast-forward time by 1000ms
      jest.advanceTimersByTime(1000);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Fast-forward another 1000ms
      jest.advanceTimersByTime(1000);
      expect(mockCallback).toHaveBeenCalledTimes(2);

      // Fast-forward another 1000ms
      jest.advanceTimersByTime(1000);
      expect(mockCallback).toHaveBeenCalledTimes(3);

      unmount();
    });

    it('should use default interval from NEXT_PUBLIC_POLL_INTERVAL_MS environment variable', () => {
      process.env.NEXT_PUBLIC_POLL_INTERVAL_MS = '5000';

      const { unmount } = renderHook(() => usePolling(mockCallback));

      expect(mockCallback).not.toHaveBeenCalled();

      // Fast-forward by 5000ms (environment variable value)
      jest.advanceTimersByTime(5000);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      unmount();
    });

    it('should use 30000ms as default interval when environment variable is not set', () => {
      delete process.env.NEXT_PUBLIC_POLL_INTERVAL_MS;

      const { unmount } = renderHook(() => usePolling(mockCallback));

      expect(mockCallback).not.toHaveBeenCalled();

      // Fast-forward by 30000ms (default value)
      jest.advanceTimersByTime(30000);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      unmount();
    });

    it('should call callback immediately on mount when runOnMount is true', () => {
      const { unmount } = renderHook(() =>
        usePolling(mockCallback, { interval: 1000, runOnMount: true })
      );

      // Callback should be called immediately
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Fast-forward by 1000ms
      jest.advanceTimersByTime(1000);
      expect(mockCallback).toHaveBeenCalledTimes(2);

      unmount();
    });

    it('should not call callback immediately on mount when runOnMount is false', () => {
      const { unmount } = renderHook(() =>
        usePolling(mockCallback, { interval: 1000, runOnMount: false })
      );

      // Callback should not be called immediately
      expect(mockCallback).not.toHaveBeenCalled();

      // Fast-forward by 1000ms
      jest.advanceTimersByTime(1000);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      unmount();
    });
  });

  describe('Page visibility handling', () => {
    it('should pause polling when document.hidden is true', () => {
      const { unmount } = renderHook(() =>
        usePolling(mockCallback, { interval: 1000 })
      );

      // Initially, page is visible and polling is active
      jest.advanceTimersByTime(1000);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Hide the page
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true,
      });

      // Trigger visibility change event
      const visibilityEvent = new Event('visibilitychange');
      document.dispatchEvent(visibilityEvent);

      // Fast-forward time - callback should not be called while page is hidden
      jest.advanceTimersByTime(1000);
      expect(mockCallback).toHaveBeenCalledTimes(1); // Still 1, not incremented

      jest.advanceTimersByTime(1000);
      expect(mockCallback).toHaveBeenCalledTimes(1); // Still 1

      unmount();
    });

    it('should resume polling when page becomes visible again', () => {
      const { unmount } = renderHook(() =>
        usePolling(mockCallback, { interval: 1000 })
      );

      // Initially, page is visible
      jest.advanceTimersByTime(1000);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Hide the page
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // Fast-forward time - no calls while hidden
      jest.advanceTimersByTime(2000);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Show the page again
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => false,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // Fast-forward time - polling should resume
      jest.advanceTimersByTime(1000);
      expect(mockCallback).toHaveBeenCalledTimes(2);

      jest.advanceTimersByTime(1000);
      expect(mockCallback).toHaveBeenCalledTimes(3);

      unmount();
    });

    it('should not start polling if page is initially hidden', () => {
      // Set page as hidden from the start
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true,
      });

      const { unmount } = renderHook(() =>
        usePolling(mockCallback, { interval: 1000 })
      );

      // Fast-forward time - no polling should occur
      jest.advanceTimersByTime(5000);
      expect(mockCallback).not.toHaveBeenCalled();

      // Show the page
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => false,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // Now polling should start
      jest.advanceTimersByTime(1000);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      unmount();
    });
  });

  describe('Cleanup and unmounting', () => {
    it('should clean up interval on unmount', () => {
      const { unmount } = renderHook(() =>
        usePolling(mockCallback, { interval: 1000 })
      );

      // Polling is active
      jest.advanceTimersByTime(1000);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Unmount the hook
      unmount();

      // Fast-forward time - callback should not be called after unmount
      jest.advanceTimersByTime(5000);
      expect(mockCallback).toHaveBeenCalledTimes(1); // Still 1, not incremented
    });

    it('should remove visibility change event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(
        document,
        'removeEventListener'
      );

      const { unmount } = renderHook(() =>
        usePolling(mockCallback, { interval: 1000 })
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Callback updates', () => {
    it('should use the latest callback without restarting the interval', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const { rerender, unmount } = renderHook(
        ({ cb }) => usePolling(cb, { interval: 1000 }),
        { initialProps: { cb: callback1 } }
      );

      // First callback is called
      jest.advanceTimersByTime(1000);
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).not.toHaveBeenCalled();

      // Update to second callback
      rerender({ cb: callback2 });

      // Second callback should now be called, not the first
      jest.advanceTimersByTime(1000);
      expect(callback1).toHaveBeenCalledTimes(1); // Still 1
      expect(callback2).toHaveBeenCalledTimes(1);

      unmount();
    });
  });

  describe('Interval changes', () => {
    it('should restart polling with new interval when interval changes', () => {
      const { rerender, unmount } = renderHook(
        ({ interval }) => usePolling(mockCallback, { interval }),
        { initialProps: { interval: 1000 } }
      );

      // First interval: 1000ms
      jest.advanceTimersByTime(1000);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Change interval to 2000ms
      rerender({ interval: 2000 });

      // Old interval should not trigger
      jest.advanceTimersByTime(1000);
      expect(mockCallback).toHaveBeenCalledTimes(1); // Still 1

      // New interval should trigger
      jest.advanceTimersByTime(1000); // Total 2000ms from rerender
      expect(mockCallback).toHaveBeenCalledTimes(2);

      unmount();
    });
  });

  describe('Async callbacks', () => {
    it('should handle async callbacks', async () => {
      const asyncCallback = jest.fn(async () => {
        await Promise.resolve();
      });

      const { unmount } = renderHook(() =>
        usePolling(asyncCallback, { interval: 1000 })
      );

      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(asyncCallback).toHaveBeenCalledTimes(1);
      });

      unmount();
    });
  });
});
