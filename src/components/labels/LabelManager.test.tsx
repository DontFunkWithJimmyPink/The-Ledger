import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { LabelManager } from './LabelManager';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('LabelManager', () => {
  let mockSupabase: any;
  let mockRouter: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRouter = {
      refresh: jest.fn(),
    };

    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };

    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('should render loading state initially', () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    });

    render(<LabelManager />);
    expect(screen.getByText('Loading labels...')).toBeInTheDocument();
  });

  it('should render labels list when loaded', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'label-1',
                name: 'Work',
                color: 'blue-100',
                user_id: 'user-123',
                created_at: '2024-01-01T00:00:00Z',
              },
              {
                id: 'label-2',
                name: 'Personal',
                color: 'green-100',
                user_id: 'user-123',
                created_at: '2024-01-01T00:00:00Z',
              },
            ],
            error: null,
          }),
        }),
      }),
    });

    render(<LabelManager />);

    await waitFor(() => {
      expect(screen.getByText('Work')).toBeInTheDocument();
      expect(screen.getByText('Personal')).toBeInTheDocument();
    });
  });

  it('should render empty state when no labels', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    });

    render(<LabelManager />);

    await waitFor(() => {
      expect(screen.getByText('No labels yet')).toBeInTheDocument();
    });
  });

  it('should open modal when new label button is clicked', async () => {
    const user = userEvent.setup();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    });

    render(<LabelManager />);

    await waitFor(() => {
      expect(screen.getByText('No labels yet')).toBeInTheDocument();
    });

    const newButton = screen.getByLabelText('New label');
    await user.click(newButton);

    expect(screen.getByText('New Label')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('should create a new label', async () => {
    const user = userEvent.setup();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Initial fetch returns empty
    const mockSelect = jest.fn();
    mockSelect.mockReturnValueOnce({
      eq: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    });

    // Insert returns new label
    const mockInsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'label-1',
            name: 'Work',
            color: 'leather-300',
            user_id: 'user-123',
            created_at: '2024-01-01T00:00:00Z',
          },
          error: null,
        }),
      }),
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'labels') {
        return {
          select: mockSelect,
          insert: mockInsert,
        };
      }
      return {};
    });

    render(<LabelManager />);

    await waitFor(() => {
      expect(screen.getByText('No labels yet')).toBeInTheDocument();
    });

    // Open modal
    const newButton = screen.getByLabelText('New label');
    await user.click(newButton);

    // Fill in form
    const nameInput = screen.getByLabelText('Name');
    await user.type(nameInput, 'Work');

    // Submit form
    const createButton = screen.getByRole('button', { name: 'Create Label' });
    await user.click(createButton);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'user-123',
        name: 'Work',
        color: 'leather-300',
      });
      expect(toast.success).toHaveBeenCalledWith('Label created');
    });
  });

  it('should delete a label', async () => {
    const user = userEvent.setup();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const mockDelete = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({
        error: null,
      }),
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'labels') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [
                  {
                    id: 'label-1',
                    name: 'Work',
                    color: 'blue-100',
                    user_id: 'user-123',
                    created_at: '2024-01-01T00:00:00Z',
                  },
                ],
                error: null,
              }),
            }),
          }),
          delete: mockDelete,
        };
      }
      return {};
    });

    render(<LabelManager />);

    await waitFor(() => {
      expect(screen.getByText('Work')).toBeInTheDocument();
    });

    // Hover to show delete button
    const labelContainer = screen.getByText('Work').closest('.group');
    expect(labelContainer).toBeInTheDocument();

    const deleteButton = screen.getByLabelText('Delete Work');
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Label "Work" deleted');
    });
  });

  it('should show error when creating duplicate label', async () => {
    const user = userEvent.setup();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    });

    const mockInsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: '23505', message: 'duplicate key value' },
        }),
      }),
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'labels') {
        return {
          select: mockSelect,
          insert: mockInsert,
        };
      }
      return {};
    });

    render(<LabelManager />);

    await waitFor(() => {
      expect(screen.getByText('No labels yet')).toBeInTheDocument();
    });

    // Open modal
    const newButton = screen.getByLabelText('New label');
    await user.click(newButton);

    // Fill in form
    const nameInput = screen.getByLabelText('Name');
    await user.type(nameInput, 'Work');

    // Submit form
    const createButton = screen.getByRole('button', { name: 'Create Label' });
    await user.click(createButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'You already have a label called "Work"'
      );
    });
  });

  it('should disable create button when label name is empty or only spaces', async () => {
    const user = userEvent.setup();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    });

    render(<LabelManager />);

    await waitFor(() => {
      expect(screen.getByText('No labels yet')).toBeInTheDocument();
    });

    // Open modal
    const newButton = screen.getByLabelText('New label');
    await user.click(newButton);

    // Create button should be disabled initially (empty input)
    const createButton = screen.getByRole('button', { name: 'Create Label' });
    expect(createButton).toBeDisabled();

    // Type only spaces (will be trimmed to empty)
    const nameInput = screen.getByLabelText('Name');
    await user.type(nameInput, '   ');

    // Create button should still be disabled
    expect(createButton).toBeDisabled();

    // Type a valid name
    await user.clear(nameInput);
    await user.type(nameInput, 'Work');

    // Create button should be enabled
    expect(createButton).not.toBeDisabled();
  });
});
