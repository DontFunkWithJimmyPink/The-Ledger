import { render, screen } from '@testing-library/react';
import { PageEditor } from './PageEditor';
import { useAutosave } from '@/lib/hooks/use-autosave';
import toast from 'react-hot-toast';
import type { Page } from '@/types';

// Mock dependencies
jest.mock('@/lib/hooks/use-autosave');
jest.mock('react-hot-toast');
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          error: null,
        })),
      })),
    })),
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

describe('PageEditor - Save Status Indicator', () => {
  const mockPage: Page = {
    id: 'test-page-id',
    notebook_id: 'test-notebook-id',
    title: 'Test Page',
    content: { type: 'doc', content: [] },
    sort_order: '0',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockUseAutosave = useAutosave as jest.MockedFunction<
    typeof useAutosave
  >;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock for useAutosave
    mockUseAutosave.mockReturnValue({
      status: 'idle',
      trigger: jest.fn(),
      reset: jest.fn(),
    });
  });

  describe('Save status display', () => {
    it('should display "Saving…" when status is saving', () => {
      mockUseAutosave.mockReturnValue({
        status: 'saving',
        trigger: jest.fn(),
        reset: jest.fn(),
      });

      render(<PageEditor pageId={mockPage.id} initialPage={mockPage} />);

      expect(screen.getByText('Saving…')).toBeInTheDocument();
    });

    it('should display "Saved" when status is saved', () => {
      mockUseAutosave.mockReturnValue({
        status: 'saved',
        trigger: jest.fn(),
        reset: jest.fn(),
      });

      render(<PageEditor pageId={mockPage.id} initialPage={mockPage} />);

      expect(screen.getByText('Saved')).toBeInTheDocument();
    });

    it('should display "Save failed — retrying" when status is error', () => {
      mockUseAutosave.mockReturnValue({
        status: 'error',
        trigger: jest.fn(),
        reset: jest.fn(),
      });

      render(<PageEditor pageId={mockPage.id} initialPage={mockPage} />);

      expect(screen.getByText('Save failed — retrying')).toBeInTheDocument();
    });

    it('should not display any status message when status is idle', () => {
      mockUseAutosave.mockReturnValue({
        status: 'idle',
        trigger: jest.fn(),
        reset: jest.fn(),
      });

      render(<PageEditor pageId={mockPage.id} initialPage={mockPage} />);

      expect(screen.queryByText('Saving…')).not.toBeInTheDocument();
      expect(screen.queryByText('Saved')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Save failed — retrying')
      ).not.toBeInTheDocument();
    });
  });

  describe('Save status styling', () => {
    it('should apply correct styling for saving status', () => {
      mockUseAutosave.mockReturnValue({
        status: 'saving',
        trigger: jest.fn(),
        reset: jest.fn(),
      });

      render(<PageEditor pageId={mockPage.id} initialPage={mockPage} />);

      const savingText = screen.getByText('Saving…');
      expect(savingText).toHaveClass('text-xs', 'text-ink-500');
    });

    it('should apply correct styling for saved status', () => {
      mockUseAutosave.mockReturnValue({
        status: 'saved',
        trigger: jest.fn(),
        reset: jest.fn(),
      });

      render(<PageEditor pageId={mockPage.id} initialPage={mockPage} />);

      const savedText = screen.getByText('Saved');
      expect(savedText).toHaveClass('text-xs', 'text-ink-500');
    });

    it('should apply error styling for error status', () => {
      mockUseAutosave.mockReturnValue({
        status: 'error',
        trigger: jest.fn(),
        reset: jest.fn(),
      });

      render(<PageEditor pageId={mockPage.id} initialPage={mockPage} />);

      const errorText = screen.getByText('Save failed — retrying');
      expect(errorText).toHaveClass('text-xs', 'text-red-600');
    });
  });

  describe('Save status container', () => {
    it('should render save status below the toolbar', () => {
      mockUseAutosave.mockReturnValue({
        status: 'saved',
        trigger: jest.fn(),
        reset: jest.fn(),
      });

      const { container } = render(
        <PageEditor pageId={mockPage.id} initialPage={mockPage} />
      );

      // Find the save status container
      const saveStatusContainer = container.querySelector(
        '.px-4.py-2.border-b.border-leather-300.bg-cream-100'
      );
      expect(saveStatusContainer).toBeInTheDocument();

      // Verify it has the correct background
      expect(saveStatusContainer).toHaveClass('bg-cream-100');
    });

    it('should have consistent styling regardless of status', () => {
      const statuses: Array<'idle' | 'saving' | 'saved' | 'error'> = [
        'idle',
        'saving',
        'saved',
        'error',
      ];

      statuses.forEach((status) => {
        const { container, unmount } = render(
          <PageEditor pageId={mockPage.id} initialPage={mockPage} />
        );

        mockUseAutosave.mockReturnValue({
          status,
          trigger: jest.fn(),
          reset: jest.fn(),
        });

        const saveStatusContainer = container.querySelector(
          '.px-4.py-2.border-b.border-leather-300.bg-cream-100'
        );
        expect(saveStatusContainer).toBeInTheDocument();

        unmount();
      });
    });
  });

  describe('Toast notifications on persistent error', () => {
    it('should show toast when status changes to error', () => {
      const mockToastError = toast.error as jest.MockedFunction<
        typeof toast.error
      >;

      const { rerender } = render(
        <PageEditor pageId={mockPage.id} initialPage={mockPage} />
      );

      // Initially idle
      mockUseAutosave.mockReturnValue({
        status: 'idle',
        trigger: jest.fn(),
        reset: jest.fn(),
      });
      rerender(<PageEditor pageId={mockPage.id} initialPage={mockPage} />);

      expect(mockToastError).not.toHaveBeenCalled();

      // Change to error
      mockUseAutosave.mockReturnValue({
        status: 'error',
        trigger: jest.fn(),
        reset: jest.fn(),
      });
      rerender(<PageEditor pageId={mockPage.id} initialPage={mockPage} />);

      expect(mockToastError).toHaveBeenCalledWith('Save failed — retrying');
    });

    it('should show toast only once per error state', () => {
      const mockToastError = toast.error as jest.MockedFunction<
        typeof toast.error
      >;

      mockUseAutosave.mockReturnValue({
        status: 'error',
        trigger: jest.fn(),
        reset: jest.fn(),
      });

      const { rerender } = render(
        <PageEditor pageId={mockPage.id} initialPage={mockPage} />
      );

      expect(mockToastError).toHaveBeenCalledTimes(1);

      // Re-render with same error status
      rerender(<PageEditor pageId={mockPage.id} initialPage={mockPage} />);

      // Should not call again (useEffect should only fire once)
      expect(mockToastError).toHaveBeenCalledTimes(1);
    });

    it('should not show toast for other statuses', () => {
      const mockToastError = toast.error as jest.MockedFunction<
        typeof toast.error
      >;
      const statuses: Array<'idle' | 'saving' | 'saved'> = [
        'idle',
        'saving',
        'saved',
      ];

      statuses.forEach((status) => {
        jest.clearAllMocks();

        mockUseAutosave.mockReturnValue({
          status,
          trigger: jest.fn(),
          reset: jest.fn(),
        });

        render(<PageEditor pageId={mockPage.id} initialPage={mockPage} />);

        expect(mockToastError).not.toHaveBeenCalled();
      });
    });
  });

  describe('Integration with useAutosave hook', () => {
    it('should use the status from useAutosave hook', () => {
      const mockTrigger = jest.fn();
      mockUseAutosave.mockReturnValue({
        status: 'saved',
        trigger: mockTrigger,
        reset: jest.fn(),
      });

      render(<PageEditor pageId={mockPage.id} initialPage={mockPage} />);

      expect(screen.getByText('Saved')).toBeInTheDocument();
      expect(mockUseAutosave).toHaveBeenCalled();
    });

    it('should render status indicator for all possible autosave states', () => {
      const statuses: Array<{
        status: 'idle' | 'saving' | 'saved' | 'error';
        expected: string | null;
      }> = [
        { status: 'idle', expected: null },
        { status: 'saving', expected: 'Saving…' },
        { status: 'saved', expected: 'Saved' },
        { status: 'error', expected: 'Save failed — retrying' },
      ];

      statuses.forEach(({ status, expected }) => {
        jest.clearAllMocks();

        mockUseAutosave.mockReturnValue({
          status,
          trigger: jest.fn(),
          reset: jest.fn(),
        });

        const { unmount } = render(
          <PageEditor pageId={mockPage.id} initialPage={mockPage} />
        );

        if (expected) {
          expect(screen.getByText(expected)).toBeInTheDocument();
        } else {
          expect(
            screen.queryByText(/Saving|Saved|failed/)
          ).not.toBeInTheDocument();
        }

        unmount();
      });
    });
  });

  describe('Layout and positioning', () => {
    it('should render components in correct order: title -> toolbar -> save status -> editor', () => {
      mockUseAutosave.mockReturnValue({
        status: 'saved',
        trigger: jest.fn(),
        reset: jest.fn(),
      });

      const { container } = render(
        <PageEditor pageId={mockPage.id} initialPage={mockPage} />
      );

      const mainDiv = container.firstChild as HTMLElement;
      const children = Array.from(mainDiv.children);

      // Check order: title container, toolbar, save status, editor
      expect(children).toHaveLength(4);

      // Title input container
      expect(
        children[0].querySelector('input[type="text"]')
      ).toBeInTheDocument();

      // Toolbar
      expect(children[1].getAttribute('data-testid')).toBe('editor-toolbar');

      // Save status
      expect(children[2]).toHaveClass(
        'px-4',
        'py-2',
        'border-b',
        'border-leather-300',
        'bg-cream-100'
      );

      // Editor content
      expect(
        children[3].querySelector('[data-testid="editor-content"]')
      ).toBeInTheDocument();
    });
  });
});
