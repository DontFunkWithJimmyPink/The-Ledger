import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { ReminderBell } from './ReminderBell';
import { createClient } from '@/lib/supabase/client';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

describe('ReminderBell', () => {
  const mockPush = jest.fn();
  const mockSelect = jest.fn();
  const mockEq = jest.fn();
  const mockFrom = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    // Setup Supabase chain
    mockEq.mockReturnValue(Promise.resolve({ count: 0, error: null }));
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });
    (createClient as jest.Mock).mockReturnValue({
      from: mockFrom,
    });
  });

  it('should render bell icon', () => {
    render(<ReminderBell />);
    const button = screen.getByRole('button', { name: /reminders/i });
    expect(button).toBeInTheDocument();
    expect(button.textContent).toContain('🔔');
  });

  it('should not show badge when count is 0', async () => {
    mockEq.mockResolvedValue({ count: 0, error: null });
    render(<ReminderBell />);

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('reminders');
      expect(mockSelect).toHaveBeenCalledWith('*', {
        count: 'exact',
        head: true,
      });
      expect(mockEq).toHaveBeenCalledWith('status', 'pending');
    });

    // Badge should not be present
    const badge = screen.queryByText('0');
    expect(badge).not.toBeInTheDocument();
  });

  it('should show badge with count when count > 0', async () => {
    mockEq.mockResolvedValue({ count: 5, error: null });
    render(<ReminderBell />);

    await waitFor(() => {
      const badge = screen.getByText('5');
      expect(badge).toBeInTheDocument();
    });
  });

  it('should navigate to /reminders on click', async () => {
    const user = userEvent.setup();
    render(<ReminderBell />);

    const button = screen.getByRole('button', { name: /reminders/i });
    await user.click(button);

    expect(mockPush).toHaveBeenCalledWith('/reminders');
  });

  it('should include count in aria-label when count > 0', async () => {
    mockEq.mockResolvedValue({ count: 3, error: null });
    render(<ReminderBell />);

    await waitFor(() => {
      const button = screen.getByRole('button', {
        name: /reminders \(3 pending\)/i,
      });
      expect(button).toBeInTheDocument();
    });
  });

  it('should handle fetch error gracefully', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockEq.mockResolvedValue({
      count: null,
      error: { message: 'Database error' },
    });

    render(<ReminderBell />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch pending reminders count:',
        { message: 'Database error' }
      );
    });

    // Should still render bell icon
    const button = screen.getByRole('button', { name: /reminders/i });
    expect(button).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('should handle null count gracefully', async () => {
    mockEq.mockResolvedValue({ count: null, error: null });
    render(<ReminderBell />);

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalled();
    });

    // Should not show badge when count is null
    const badge = screen.queryByText(/\d+/);
    expect(badge).not.toBeInTheDocument();
  });

  it('should accept custom className', () => {
    const { container } = render(<ReminderBell className="custom-class" />);
    const button = container.querySelector('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should use initialCount prop as initial state', () => {
    render(<ReminderBell initialCount={7} />);

    // Should show badge with initial count immediately
    const badge = screen.getByText('7');
    expect(badge).toBeInTheDocument();
  });

  it('should fetch count even when initialCount is provided', async () => {
    mockEq.mockResolvedValue({ count: 10, error: null });
    render(<ReminderBell initialCount={5} />);

    // Initial count should show first
    expect(screen.getByText('5')).toBeInTheDocument();

    // After fetch completes, count should update
    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.queryByText('5')).not.toBeInTheDocument();
    });
  });

  it('should show large count numbers', async () => {
    mockEq.mockResolvedValue({ count: 99, error: null });
    render(<ReminderBell />);

    await waitFor(() => {
      const badge = screen.getByText('99');
      expect(badge).toBeInTheDocument();
    });
  });
});
