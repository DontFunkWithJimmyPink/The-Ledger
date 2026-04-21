import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { TopBar } from './TopBar';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

jest.mock('react-hot-toast', () => {
  const mockToast = jest.fn() as jest.Mock & { error: jest.Mock };
  mockToast.error = jest.fn();
  return {
    __esModule: true,
    default: mockToast,
  };
});

jest.mock('@/components/reminders/ReminderBell', () => ({
  ReminderBell: () => (
    <button type="button" aria-label="Reminders">
      🔔
    </button>
  ),
}));

describe('TopBar', () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();
  const mockSignOut = jest.fn();
  const mockSearchParams = {
    get: jest.fn(),
    toString: jest.fn().mockReturnValue(''),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
    (usePathname as jest.Mock).mockReturnValue('/notebook');
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        signOut: mockSignOut,
      },
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should render search input', () => {
    render(<TopBar />);
    const searchInput = screen.getByPlaceholderText('Search pages...');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('type', 'search');
  });

  it('should handle search input changes', async () => {
    const user = userEvent.setup({ delay: null });
    render(<TopBar />);
    const searchInput = screen.getByPlaceholderText('Search pages...');
    await user.type(searchInput, 'test query');
    expect(searchInput).toHaveValue('test query');
  });

  it('should trigger debounced search after 300ms on notebook page', async () => {
    const user = userEvent.setup({ delay: null });
    render(<TopBar />);
    const searchInput = screen.getByPlaceholderText('Search pages...');

    // Type a search query
    await user.type(searchInput, 'test query');

    // Should not trigger immediately
    expect(mockPush).not.toHaveBeenCalled();

    // Fast-forward 300ms
    jest.advanceTimersByTime(300);

    // Should now trigger search with query param
    expect(mockPush).toHaveBeenCalledWith('/notebook?q=test+query');
  });

  it('should debounce multiple search inputs', async () => {
    const user = userEvent.setup({ delay: null });
    render(<TopBar />);
    const searchInput = screen.getByPlaceholderText('Search pages...');

    // Type multiple characters
    await user.type(searchInput, 'test');
    jest.advanceTimersByTime(100);
    await user.type(searchInput, ' query');

    // Should not have triggered yet
    expect(mockPush).not.toHaveBeenCalled();

    // Fast-forward 300ms from last input
    jest.advanceTimersByTime(300);

    // Should only trigger once with final query
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/notebook?q=test+query');
  });

  it('should clear search query when input is cleared', async () => {
    const user = userEvent.setup({ delay: null });
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === 'q') return 'existing query';
      return null;
    });
    render(<TopBar />);
    const searchInput = screen.getByPlaceholderText('Search pages...');

    // Clear the input
    await user.clear(searchInput);

    // Fast-forward debounce
    jest.advanceTimersByTime(300);

    // Should push URL without query param
    expect(mockPush).toHaveBeenCalledWith('/notebook');
  });

  it('should preserve sort params when searching', async () => {
    const user = userEvent.setup({ delay: null });
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === 'sortBy') return 'title';
      if (key === 'direction') return 'desc';
      return null;
    });

    render(<TopBar />);
    const searchInput = screen.getByPlaceholderText('Search pages...');

    await user.type(searchInput, 'test');
    jest.advanceTimersByTime(300);

    expect(mockPush).toHaveBeenCalledWith(
      '/notebook?q=test&sortBy=title&direction=desc'
    );
  });

  it('should not trigger search when not on notebook page', async () => {
    const user = userEvent.setup({ delay: null });
    (usePathname as jest.Mock).mockReturnValue('/other-page');

    render(<TopBar />);
    const searchInput = screen.getByPlaceholderText('Search pages...');

    await user.type(searchInput, 'test query');
    jest.advanceTimersByTime(300);

    // Should not trigger router.push
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should initialize search query from URL params', () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === 'q') return 'existing query';
      return null;
    });
    render(<TopBar />);
    const searchInput = screen.getByPlaceholderText('Search pages...');
    expect(searchInput).toHaveValue('existing query');
  });

  it('should render reminder bell button', () => {
    render(<TopBar />);
    const reminderButton = screen.getByRole('button', { name: /reminders/i });
    expect(reminderButton).toBeInTheDocument();
  });

  it('should render user menu button', () => {
    render(<TopBar />);
    const userMenuButton = screen.getByRole('button', { name: /user menu/i });
    expect(userMenuButton).toBeInTheDocument();
  });

  it('should toggle user menu on click', async () => {
    const user = userEvent.setup({ delay: null });
    render(<TopBar />);
    const userMenuButton = screen.getByRole('button', { name: /user menu/i });

    // Menu should not be visible initially
    expect(screen.queryByText('Sign out')).not.toBeInTheDocument();

    // Click to open menu
    await user.click(userMenuButton);
    expect(screen.getByText('Sign out')).toBeInTheDocument();

    // Click again to close menu
    await user.click(userMenuButton);
    await waitFor(() => {
      expect(screen.queryByText('Sign out')).not.toBeInTheDocument();
    });
  });

  it('should close user menu when clicking backdrop', async () => {
    const user = userEvent.setup({ delay: null });
    render(<TopBar />);
    const userMenuButton = screen.getByRole('button', { name: /user menu/i });

    // Open menu
    await user.click(userMenuButton);
    expect(screen.getByText('Sign out')).toBeInTheDocument();

    // Click backdrop to close
    const backdrop = document.querySelector('.fixed.inset-0');
    if (backdrop) {
      await user.click(backdrop);
      await waitFor(() => {
        expect(screen.queryByText('Sign out')).not.toBeInTheDocument();
      });
    }
  });

  it('should handle successful logout', async () => {
    const user = userEvent.setup({ delay: null });
    mockSignOut.mockResolvedValue({ error: null });
    render(<TopBar />);

    // Open user menu
    const userMenuButton = screen.getByRole('button', { name: /user menu/i });
    await user.click(userMenuButton);

    // Click sign out
    const signOutButton = screen.getByText('Sign out');
    await user.click(signOutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/login');
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });

  it('should handle logout error', async () => {
    const user = userEvent.setup({ delay: null });
    mockSignOut.mockResolvedValue({ error: { message: 'Logout failed' } });
    render(<TopBar />);

    // Open user menu
    const userMenuButton = screen.getByRole('button', { name: /user menu/i });
    await user.click(userMenuButton);

    // Click sign out
    const signOutButton = screen.getByText('Sign out');
    await user.click(signOutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith('Failed to sign out');
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('should accept custom className', () => {
    const { container } = render(<TopBar className="custom-class" />);
    const header = container.querySelector('header');
    expect(header).toHaveClass('custom-class');
  });
});
