import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { TopBar } from './TopBar';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
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

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        signOut: mockSignOut,
      },
    });
  });

  it('should render search input', () => {
    render(<TopBar />);
    const searchInput = screen.getByPlaceholderText('Search pages...');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('type', 'search');
  });

  it('should handle search input changes', async () => {
    const user = userEvent.setup();
    render(<TopBar />);
    const searchInput = screen.getByPlaceholderText('Search pages...');
    await user.type(searchInput, 'test query');
    expect(searchInput).toHaveValue('test query');
  });

  it('should show placeholder toast on search submit', async () => {
    const user = userEvent.setup();
    render(<TopBar />);
    const searchInput = screen.getByPlaceholderText('Search pages...');
    await user.type(searchInput, 'test query{Enter}');
    expect(toast).toHaveBeenCalledWith('Search functionality coming soon', {
      icon: '🔍',
    });
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
    const user = userEvent.setup();
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
    const user = userEvent.setup();
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
    const user = userEvent.setup();
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
    const user = userEvent.setup();
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
