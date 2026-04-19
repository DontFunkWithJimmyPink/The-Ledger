import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PageEditor } from './PageEditor';
import { useAutosave } from '@/lib/hooks/use-autosave';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import type { Page } from '@/types';

// Mock dependencies
jest.mock('@/lib/hooks/use-autosave');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
jest.mock('react-hot-toast', () => {
  const mockToast = jest.fn();
  mockToast.error = jest.fn();
  mockToast.success = jest.fn();
  return mockToast;
});

// Mock Supabase client - must be done before importing PageEditor
const mockDeleteFn = jest.fn();
const mockEqFn = jest.fn();
const mockUpdateFn = jest.fn();
const mockUpdateEqFn = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table) => {
      if (table === 'pages') {
        return {
          delete: mockDeleteFn,
          update: mockUpdateFn,
        };
      }
      return {};
    }),
  })),
}));

// Mock Tiptap editor
jest.mock('@tiptap/react', () => ({
  useEditor: jest.fn(() => null),
  EditorContent: jest.fn(() => <div data-testid="editor-content" />),
}));

jest.mock('@/components/editor/EditorToolbar', () => ({
  EditorToolbar: jest.fn(() => <div data-testid="editor-toolbar" />),
}));

jest.mock('@/components/ui/Modal', () => ({
  Modal: jest.fn(({ isOpen, title, children }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="delete-modal">
        <h2>{title}</h2>
        {children}
      </div>
    );
  }),
}));

describe('PageEditor - Delete Functionality', () => {
  const mockPage: Page = {
    id: 'test-page-id',
    notebook_id: 'test-notebook-id',
    title: 'Test Page',
    content: { type: 'doc', content: [] },
    sort_order: '0',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useRouter
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    // Mock useAutosave
    (useAutosave as jest.MockedFunction<typeof useAutosave>).mockReturnValue({
      status: 'idle',
      trigger: jest.fn(),
      reset: jest.fn(),
    });

    // Reset delete mock chain
    mockEqFn.mockResolvedValue({ error: null });
    mockDeleteFn.mockReturnValue({ eq: mockEqFn });

    // Reset update mock chain
    mockUpdateEqFn.mockResolvedValue({ error: null });
    mockUpdateFn.mockReturnValue({ eq: mockUpdateEqFn });
  });

  it('should render delete button', () => {
    render(<PageEditor pageId={mockPage.id} initialPage={mockPage} />);
    expect(screen.getByLabelText('Delete page')).toBeInTheDocument();
  });

  it('should open confirmation modal when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<PageEditor pageId={mockPage.id} initialPage={mockPage} />);

    const deleteButton = screen.getByLabelText('Delete page');
    await user.click(deleteButton);

    expect(screen.getByTestId('delete-modal')).toBeInTheDocument();
    expect(screen.getByText('Delete Page')).toBeInTheDocument();
  });

  it('should close modal when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<PageEditor pageId={mockPage.id} initialPage={mockPage} />);

    // Open modal
    const deleteButton = screen.getByLabelText('Delete page');
    await user.click(deleteButton);
    expect(screen.getByTestId('delete-modal')).toBeInTheDocument();

    // Click Cancel
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByTestId('delete-modal')).not.toBeInTheDocument();
    });
  });

  it('should display warning message in confirmation modal', async () => {
    const user = userEvent.setup();
    render(<PageEditor pageId={mockPage.id} initialPage={mockPage} />);

    const deleteButton = screen.getByLabelText('Delete page');
    await user.click(deleteButton);

    expect(
      screen.getByText(/Are you sure you want to delete this page?/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/All associated tasks, drawings, and photos/i)
    ).toBeInTheDocument();
  });

  it('should call Supabase delete and redirect on successful deletion', async () => {
    const user = userEvent.setup();

    render(<PageEditor pageId={mockPage.id} initialPage={mockPage} />);

    // Open modal
    const deleteButton = screen.getByLabelText('Delete page');
    await user.click(deleteButton);

    // Click Delete in modal
    const modal = screen.getByTestId('delete-modal');
    const confirmButton = within(modal).getByRole('button', { name: 'Delete' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteFn).toHaveBeenCalled();
      expect(mockEqFn).toHaveBeenCalledWith('id', 'test-page-id');
      expect(toast.success).toHaveBeenCalledWith('Page deleted');
      expect(mockPush).toHaveBeenCalledWith('/notebook');
    });
  });

  it('should show error toast on delete failure', async () => {
    const user = userEvent.setup();

    // Mock delete failure
    mockEqFn.mockResolvedValue({ error: { message: 'Delete failed' } });

    render(<PageEditor pageId={mockPage.id} initialPage={mockPage} />);

    // Open modal
    const deleteButton = screen.getByLabelText('Delete page');
    await user.click(deleteButton);

    // Click Delete in modal
    const modal = screen.getByTestId('delete-modal');
    const confirmButton = within(modal).getByRole('button', { name: 'Delete' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to delete page');
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('should disable buttons while deleting', async () => {
    const user = userEvent.setup();

    // Mock a slow delete
    mockEqFn.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ error: null }), 100)
        )
    );

    render(<PageEditor pageId={mockPage.id} initialPage={mockPage} />);

    // Open modal
    const deleteButton = screen.getByLabelText('Delete page');
    await user.click(deleteButton);

    // Click Delete in modal
    const modal = screen.getByTestId('delete-modal');
    const confirmButton = within(modal).getByRole('button', { name: 'Delete' });
    await user.click(confirmButton);

    // Buttons should be disabled
    await waitFor(() => {
      expect(screen.getByText('Deleting...')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeDisabled();
    });
  });
});
