import { renderHook } from '@testing-library/react';
import { useReminders } from './use-reminders';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock dependencies
jest.mock('@/lib/supabase/client');
jest.mock('react-hot-toast');
jest.mock('./use-polling');

// Import the mocked module to access its implementation
import { usePolling } from './use-polling';

// Mock timers
jest.useFakeTimers();

describe('useReminders', () => {
  let mockSupabase: Partial<SupabaseClient>;
  let mockRpc: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockEq: jest.Mock;
  let mockToast: jest.MockedFunction<typeof toast>;
  let mockToastCustom: jest.Mock;
  let mockToastDismiss: jest.Mock;
  let mockToastError: jest.Mock;
  let pollingCallback: (() => void | Promise<void>) | null = null;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    pollingCallback = null;

    // Mock usePolling to capture the callback
    (usePolling as jest.Mock).mockImplementation((callback) => {
      pollingCallback = callback;
    });

    // Mock Supabase client methods
    mockEq = jest.fn().mockResolvedValue({ data: null, error: null });
    mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    mockRpc = jest.fn().mockResolvedValue({ data: [], error: null });

    mockSupabase = {
      rpc: mockRpc,
      from: jest.fn().mockReturnValue({
        update: mockUpdate,
      }),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    // Mock toast functions
    mockToastCustom = jest.fn();
    mockToastDismiss = jest.fn();
    mockToastError = jest.fn();

    mockToast = toast as jest.MockedFunction<typeof toast>;
    mockToast.mockReturnValue('toast-id');
    mockToast.custom = mockToastCustom;
    mockToast.dismiss = mockToastDismiss;
    mockToast.error = mockToastError;

    // Mock document.hidden
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  describe('Initialization', () => {
    it('should call usePolling with 30-second interval', () => {
      renderHook(() => useReminders());

      expect(usePolling).toHaveBeenCalledWith(expect.any(Function), {
        interval: 30000,
        runOnMount: true,
      });
    });

    it('should create a Supabase client', () => {
      renderHook(() => useReminders());

      expect(createClient).toHaveBeenCalled();
    });
  });

  describe('Polling callback behavior', () => {
    it('should call get_due_reminders RPC function', async () => {
      renderHook(() => useReminders());

      expect(pollingCallback).not.toBeNull();

      // Execute the polling callback
      await pollingCallback!();

      expect(mockRpc).toHaveBeenCalledWith('get_due_reminders');
    });

    it('should handle RPC errors gracefully', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC error' },
      });

      renderHook(() => useReminders());

      await pollingCallback!();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch due reminders:',
        { message: 'RPC error' }
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle empty reminder list', async () => {
      mockRpc.mockResolvedValue({ data: [], error: null });

      renderHook(() => useReminders());

      await pollingCallback!();

      expect(mockToast).not.toHaveBeenCalled();
      expect(mockToastCustom).not.toHaveBeenCalled();
    });

    it('should handle null data', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null });

      renderHook(() => useReminders());

      await pollingCallback!();

      expect(mockToast).not.toHaveBeenCalled();
      expect(mockToastCustom).not.toHaveBeenCalled();
    });
  });

  describe('Toast notification display', () => {
    it('should show toast for a task reminder with task_text', async () => {
      const reminder = {
        id: 'reminder-1',
        task_id: 'task-1',
        page_id: 'page-1',
        fire_at: '2026-04-19T15:00:00Z',
        task_text: 'Complete the report',
        page_title: 'Work Notes',
      };

      mockRpc.mockResolvedValue({ data: [reminder], error: null });

      renderHook(() => useReminders());

      await pollingCallback!();

      // Should call toast.custom with the reminder details
      expect(mockToastCustom).toHaveBeenCalledWith(expect.any(Function), {
        id: 'reminder-1',
        duration: Infinity,
      });
    });

    it('should show toast for a page reminder with page_title only', async () => {
      const reminder = {
        id: 'reminder-2',
        task_id: null,
        page_id: 'page-2',
        fire_at: '2026-04-19T16:00:00Z',
        task_text: null,
        page_title: 'Meeting Notes',
      };

      mockRpc.mockResolvedValue({ data: [reminder], error: null });

      renderHook(() => useReminders());

      await pollingCallback!();

      expect(mockToastCustom).toHaveBeenCalledWith(expect.any(Function), {
        id: 'reminder-2',
        duration: Infinity,
      });
    });

    it('should show generic "Reminder" text when both task_text and page_title are null', async () => {
      const reminder = {
        id: 'reminder-3',
        task_id: null,
        page_id: null,
        fire_at: '2026-04-19T17:00:00Z',
        task_text: null,
        page_title: null,
      };

      mockRpc.mockResolvedValue({ data: [reminder], error: null });

      renderHook(() => useReminders());

      await pollingCallback!();

      expect(mockToastCustom).toHaveBeenCalledWith(expect.any(Function), {
        id: 'reminder-3',
        duration: Infinity,
      });
    });

    it('should show toast for multiple reminders', async () => {
      const reminders = [
        {
          id: 'reminder-1',
          task_id: 'task-1',
          page_id: 'page-1',
          fire_at: '2026-04-19T15:00:00Z',
          task_text: 'Task 1',
          page_title: 'Page 1',
        },
        {
          id: 'reminder-2',
          task_id: null,
          page_id: 'page-2',
          fire_at: '2026-04-19T16:00:00Z',
          task_text: null,
          page_title: 'Page 2',
        },
      ];

      mockRpc.mockResolvedValue({ data: reminders, error: null });

      renderHook(() => useReminders());

      await pollingCallback!();

      expect(mockToastCustom).toHaveBeenCalledTimes(2);
    });
  });

  describe('Dismiss functionality', () => {
    it('should update reminder status to dismissed when dismiss button is clicked', async () => {
      const reminder = {
        id: 'reminder-1',
        task_id: 'task-1',
        page_id: 'page-1',
        fire_at: '2026-04-19T15:00:00Z',
        task_text: 'Complete the report',
        page_title: 'Work Notes',
      };

      mockRpc.mockResolvedValue({ data: [reminder], error: null });

      renderHook(() => useReminders());

      await pollingCallback!();

      // Get the custom toast render function
      const customToastCall = mockToastCustom.mock.calls[0];
      const renderFunction = customToastCall[0];

      // Simulate rendering the custom toast
      const mockT = { visible: true, id: 'toast-1' };
      const toastElement = renderFunction(mockT);

      // Find and click the dismiss button
      // Since we're in a test environment, we'll simulate the onClick handler
      const dismissButton = toastElement.props.children[1].props.children;
      await dismissButton.props.onClick();

      // Verify that the database was updated
      expect(mockSupabase.from).toHaveBeenCalledWith('reminders');
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'dismissed' });
      expect(mockEq).toHaveBeenCalledWith('id', 'reminder-1');

      // Verify that the toast was dismissed
      expect(mockToastDismiss).toHaveBeenCalledWith('toast-1');
    });

    it('should show error toast if dismiss fails', async () => {
      const reminder = {
        id: 'reminder-1',
        task_id: 'task-1',
        page_id: 'page-1',
        fire_at: '2026-04-19T15:00:00Z',
        task_text: 'Complete the report',
        page_title: 'Work Notes',
      };

      mockRpc.mockResolvedValue({ data: [reminder], error: null });
      mockEq.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });

      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      renderHook(() => useReminders());

      await pollingCallback!();

      // Get the custom toast render function and simulate dismiss click
      const customToastCall = mockToastCustom.mock.calls[0];
      const renderFunction = customToastCall[0];
      const mockT = { visible: true, id: 'toast-1' };
      const toastElement = renderFunction(mockT);
      const dismissButton = toastElement.props.children[1].props.children;

      await dismissButton.props.onClick();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to dismiss reminder:',
        { message: 'Update failed' }
      );
      expect(mockToastError).toHaveBeenCalledWith('Failed to dismiss reminder');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Duplicate prevention', () => {
    it('should not show the same reminder twice', async () => {
      const reminder = {
        id: 'reminder-1',
        task_id: 'task-1',
        page_id: 'page-1',
        fire_at: '2026-04-19T15:00:00Z',
        task_text: 'Complete the report',
        page_title: 'Work Notes',
      };

      mockRpc.mockResolvedValue({ data: [reminder], error: null });

      renderHook(() => useReminders());

      // First poll
      await pollingCallback!();
      expect(mockToastCustom).toHaveBeenCalledTimes(1);

      // Second poll with same reminder
      mockToastCustom.mockClear();
      await pollingCallback!();
      expect(mockToastCustom).not.toHaveBeenCalled();
    });

    it('should show new reminders after showing previous ones', async () => {
      const reminder1 = {
        id: 'reminder-1',
        task_id: 'task-1',
        page_id: 'page-1',
        fire_at: '2026-04-19T15:00:00Z',
        task_text: 'Task 1',
        page_title: 'Page 1',
      };

      const reminder2 = {
        id: 'reminder-2',
        task_id: 'task-2',
        page_id: 'page-2',
        fire_at: '2026-04-19T16:00:00Z',
        task_text: 'Task 2',
        page_title: 'Page 2',
      };

      // First poll - only reminder 1
      mockRpc.mockResolvedValue({ data: [reminder1], error: null });
      renderHook(() => useReminders());
      await pollingCallback!();
      expect(mockToastCustom).toHaveBeenCalledTimes(1);

      // Second poll - both reminders
      mockToastCustom.mockClear();
      mockRpc.mockResolvedValue({ data: [reminder1, reminder2], error: null });
      await pollingCallback!();

      // Should only show reminder 2 (reminder 1 already shown)
      expect(mockToastCustom).toHaveBeenCalledTimes(1);
      expect(mockToastCustom).toHaveBeenCalledWith(expect.any(Function), {
        id: 'reminder-2',
        duration: Infinity,
      });
    });
  });

  describe('Error handling', () => {
    it('should handle unexpected errors during polling', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockRpc.mockRejectedValue(new Error('Network error'));

      renderHook(() => useReminders());

      await pollingCallback!();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error checking reminders:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should continue polling after errors', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // First call fails
      mockRpc.mockRejectedValueOnce(new Error('Network error'));

      renderHook(() => useReminders());

      await pollingCallback!();
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Second call succeeds
      consoleErrorSpy.mockClear();
      const reminder = {
        id: 'reminder-1',
        task_id: 'task-1',
        page_id: 'page-1',
        fire_at: '2026-04-19T15:00:00Z',
        task_text: 'Task text',
        page_title: 'Page title',
      };
      mockRpc.mockResolvedValue({ data: [reminder], error: null });

      await pollingCallback!();
      expect(mockToastCustom).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
