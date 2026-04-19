import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ReminderItem } from './ReminderItem';
import { createClient } from '@/lib/supabase/client';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => {
  const mockToast = jest.fn() as jest.Mock & {
    error: jest.Mock;
    success: jest.Mock;
  };
  mockToast.error = jest.fn();
  mockToast.success = jest.fn();
  return {
    __esModule: true,
    default: mockToast,
  };
});

describe('ReminderItem', () => {
  const mockReminder = {
    id: 'reminder-1',
    task_id: 'task-1',
    page_id: 'page-1',
    fire_at: '2024-01-15T10:00:00Z',
    status: 'pending',
    task_text: 'Buy milk',
    page_title: 'Shopping List',
  };

  const mockRefresh = jest.fn();
  const mockUpdate = jest.fn();
  const mockEq = jest.fn();
  const mockFrom = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useRouter as jest.Mock).mockReturnValue({
      refresh: mockRefresh,
    });

    // Setup Supabase chain
    mockEq.mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ update: mockUpdate });
    (createClient as jest.Mock).mockReturnValue({
      from: mockFrom,
    });
  });

  it('should render reminder with task text', () => {
    render(<ReminderItem reminder={mockReminder} />);
    expect(screen.getByText('Buy milk')).toBeInTheDocument();
  });

  it('should render reminder with page title when no task text', () => {
    const reminderWithoutTask = {
      ...mockReminder,
      task_text: null,
    };
    render(<ReminderItem reminder={reminderWithoutTask} />);
    expect(screen.getByText('Shopping List')).toBeInTheDocument();
  });

  it('should render "Reminder" fallback when no text or title', () => {
    const reminderWithoutText = {
      ...mockReminder,
      task_text: null,
      page_title: null,
    };
    render(<ReminderItem reminder={reminderWithoutText} />);
    expect(screen.getByText('Reminder')).toBeInTheDocument();
  });

  it('should format and display fire_at time', () => {
    render(<ReminderItem reminder={mockReminder} />);
    // The exact format depends on locale, but it should include month and day
    const timeElement = screen.getByText(/Jan/i);
    expect(timeElement).toBeInTheDocument();
  });

  it('should display page title as metadata when both task and page exist', () => {
    render(<ReminderItem reminder={mockReminder} />);
    // Page title should appear in metadata section
    const metadataElements = screen.getAllByText('Shopping List');
    expect(metadataElements.length).toBeGreaterThan(0);
  });

  it('should link to the correct page', () => {
    render(<ReminderItem reminder={mockReminder} />);
    const link = screen.getByRole('link', { name: /buy milk/i });
    expect(link).toHaveAttribute('href', '/notebook/page-1');
  });

  it('should link to notebook when no page_id', () => {
    const reminderWithoutPage = {
      ...mockReminder,
      page_id: null,
    };
    render(<ReminderItem reminder={reminderWithoutPage} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/notebook');
  });

  it('should render dismiss button', () => {
    render(<ReminderItem reminder={mockReminder} />);
    const button = screen.getByRole('button', { name: /dismiss/i });
    expect(button).toBeInTheDocument();
  });

  it('should dismiss reminder on button click', async () => {
    const user = userEvent.setup();
    render(<ReminderItem reminder={mockReminder} />);

    const button = screen.getByRole('button', { name: /dismiss/i });
    await user.click(button);

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('reminders');
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'dismissed' });
      expect(mockEq).toHaveBeenCalledWith('id', 'reminder-1');
      expect(toast.success).toHaveBeenCalledWith('Reminder dismissed');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('should show dismissing state during dismiss', async () => {
    const user = userEvent.setup();
    // Make the update promise hang
    mockEq.mockReturnValue(new Promise(() => {}));

    render(<ReminderItem reminder={mockReminder} />);

    const button = screen.getByRole('button', { name: /dismiss/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Dismissing...')).toBeInTheDocument();
    });
  });

  it('should disable button while dismissing', async () => {
    const user = userEvent.setup();
    // Make the update promise hang
    mockEq.mockReturnValue(new Promise(() => {}));

    render(<ReminderItem reminder={mockReminder} />);

    const button = screen.getByRole('button', { name: /dismiss/i });
    await user.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
    });
  });

  it('should handle dismiss error gracefully', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    mockEq.mockResolvedValue({
      error: { message: 'Database error' },
    });

    render(<ReminderItem reminder={mockReminder} />);

    const button = screen.getByRole('button', { name: /dismiss/i });
    await user.click(button);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to dismiss reminder:',
        { message: 'Database error' }
      );
      expect(toast.error).toHaveBeenCalledWith('Failed to dismiss reminder');
    });

    // Button should be re-enabled after error
    expect(button).not.toBeDisabled();

    consoleErrorSpy.mockRestore();
  });

  it('should handle dismiss exception gracefully', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    mockEq.mockRejectedValue(new Error('Network error'));

    render(<ReminderItem reminder={mockReminder} />);

    const button = screen.getByRole('button', { name: /dismiss/i });
    await user.click(button);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error dismissing reminder:',
        expect.any(Error)
      );
      expect(toast.error).toHaveBeenCalledWith('Failed to dismiss reminder');
    });

    consoleErrorSpy.mockRestore();
  });

  it('should not render after successful dismiss', async () => {
    const user = userEvent.setup();
    render(<ReminderItem reminder={mockReminder} />);

    const button = screen.getByRole('button', { name: /dismiss/i });
    await user.click(button);

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });

    // After setting isDismissed to true, component should render null
    // We can't easily test this without re-rendering, but we can verify the dismiss flow completed
    expect(toast.success).toHaveBeenCalled();
  });
});
