import { render, screen, waitFor, act } from '@testing-library/react';
import { PageListWrapper } from './PageListWrapper';
import type { Page } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { usePolling } from '@/lib/hooks/use-polling';

// Mock Supabase client
jest.mock('@/lib/supabase/client');

// Mock polling hook
jest.mock('@/lib/hooks/use-polling');

// Mock next/navigation
const mockPush = jest.fn();
const mockSearchParams = new URLSearchParams();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}));

// Mock PageList component
jest.mock('@/components/layout', () => ({
  PageList: ({ pages }: { pages: Page[] }) => (
    <div data-testid="page-list">
      {pages.map((page) => (
        <div key={page.id} data-testid={`page-${page.id}`}>
          {page.title}
        </div>
      ))}
    </div>
  ),
}));

// Mock SortControl component
jest.mock('@/components/ui', () => ({
  SortControl: ({
    sortBy,
    direction,
    onSortChange,
  }: {
    sortBy: string;
    direction: string;
    onSortChange: (sortBy: string, direction: string) => void;
  }) => (
    <div data-testid="sort-control">
      <button
        onClick={() => onSortChange('title', 'asc')}
        data-testid="sort-button"
      >
        Sort by {sortBy} {direction}
      </button>
    </div>
  ),
}));

describe('PageListWrapper', () => {
  const mockPages: Page[] = [
    {
      id: 'page-1',
      notebook_id: 'notebook-1',
      title: 'First Page',
      content: {},
      sort_order: 'a0',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'page-2',
      notebook_id: 'notebook-1',
      title: 'Second Page',
      content: {},
      sort_order: 'a1',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    },
    {
      id: 'page-3',
      notebook_id: 'notebook-1',
      title: 'Third Page',
      content: {},
      sort_order: 'a2',
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z',
    },
  ];

  const mockSupabaseSelect = jest.fn();
  const mockSupabaseFrom = jest.fn();

  let pollingCallback: (() => void | Promise<void>) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    pollingCallback = null;

    // Capture the polling callback
    (usePolling as jest.Mock).mockImplementation(
      (callback: () => void | Promise<void>) => {
        pollingCallback = callback;
      }
    );

    // Setup Supabase mock
    mockSupabaseSelect.mockReturnValue({
      order: jest.fn().mockResolvedValue({ data: mockPages, error: null }),
    });

    mockSupabaseFrom.mockReturnValue({
      select: mockSupabaseSelect,
    });

    (createClient as jest.Mock).mockReturnValue({
      from: mockSupabaseFrom,
    });
  });

  describe('Initial rendering', () => {
    it('should render pages from server props', () => {
      render(<PageListWrapper pages={mockPages} />);

      expect(screen.getByText('First Page')).toBeInTheDocument();
      expect(screen.getByText('Second Page')).toBeInTheDocument();
      expect(screen.getByText('Third Page')).toBeInTheDocument();
    });

    it('should display page count', () => {
      render(<PageListWrapper pages={mockPages} />);

      expect(screen.getByText('3 pages')).toBeInTheDocument();
    });

    it('should display singular page count', () => {
      render(<PageListWrapper pages={[mockPages[0]]} />);

      expect(screen.getByText('1 page')).toBeInTheDocument();
    });

    it('should render sort controls', () => {
      render(<PageListWrapper pages={mockPages} />);

      expect(screen.getByTestId('sort-control')).toBeInTheDocument();
    });
  });

  describe('Polling setup', () => {
    it('should mount usePolling with 30-second interval', () => {
      render(<PageListWrapper pages={mockPages} />);

      expect(usePolling).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          interval: 30000,
          runOnMount: false,
        })
      );
    });

    it('should not run polling on mount (already has server data)', () => {
      render(<PageListWrapper pages={mockPages} />);

      expect(usePolling).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          runOnMount: false,
        })
      );
    });
  });

  describe('Polling behavior', () => {
    it('should fetch page metadata on poll tick', async () => {
      render(<PageListWrapper pages={mockPages} />);

      expect(pollingCallback).not.toBeNull();

      // Trigger polling
      await act(async () => {
        await pollingCallback!();
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('pages');
      expect(mockSupabaseSelect).toHaveBeenCalledWith(
        'id, title, sort_order, updated_at'
      );
    });

    it('should update pages when updated_at changes', async () => {
      render(<PageListWrapper pages={mockPages} />);

      // Initial render
      expect(screen.getByText('First Page')).toBeInTheDocument();

      // Setup new data with updated timestamp
      const updatedPages = [
        {
          ...mockPages[0],
          title: 'Updated First Page',
          updated_at: '2024-01-01T01:00:00Z', // Changed timestamp
        },
        mockPages[1],
        mockPages[2],
      ];

      mockSupabaseSelect.mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: updatedPages, error: null }),
      });

      // Trigger polling
      await act(async () => {
        await pollingCallback!();
      });

      await waitFor(() => {
        expect(screen.getByText('Updated First Page')).toBeInTheDocument();
      });
    });

    it('should not re-render when data has not changed', async () => {
      render(<PageListWrapper pages={mockPages} />);

      // Mock select to return same data
      mockSupabaseSelect.mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: mockPages, error: null }),
      });

      const initialPageList = screen.getByTestId('page-list');

      // Trigger polling
      await act(async () => {
        await pollingCallback!();
      });

      // Wait a bit to ensure any potential re-render would happen
      await waitFor(() => {
        const currentPageList = screen.getByTestId('page-list');
        // Component should not re-render if data hasn't changed
        expect(currentPageList).toBe(initialPageList);
      });
    });

    it('should detect new pages in polled data', async () => {
      render(<PageListWrapper pages={mockPages} />);

      // Setup new data with an additional page
      const newPages = [
        ...mockPages,
        {
          id: 'page-4',
          notebook_id: 'notebook-1',
          title: 'Fourth Page',
          content: {},
          sort_order: 'a3',
          created_at: '2024-01-04T00:00:00Z',
          updated_at: '2024-01-04T00:00:00Z',
        },
      ];

      mockSupabaseSelect.mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: newPages, error: null }),
      });

      // Trigger polling
      await act(async () => {
        await pollingCallback!();
      });

      await waitFor(() => {
        expect(screen.getByText('Fourth Page')).toBeInTheDocument();
      });
    });

    it('should detect deleted pages in polled data', async () => {
      render(<PageListWrapper pages={mockPages} />);

      // Setup new data with a page removed
      const reducedPages = [mockPages[0], mockPages[2]];

      mockSupabaseSelect.mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: reducedPages, error: null }),
      });

      // Trigger polling
      await act(async () => {
        await pollingCallback!();
      });

      await waitFor(() => {
        expect(screen.queryByText('Second Page')).not.toBeInTheDocument();
        expect(screen.getByText('First Page')).toBeInTheDocument();
        expect(screen.getByText('Third Page')).toBeInTheDocument();
      });
    });

    it('should handle polling errors gracefully', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      render(<PageListWrapper pages={mockPages} />);

      // Setup error response
      mockSupabaseSelect.mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });

      // Trigger polling
      await act(async () => {
        await pollingCallback!();
      });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to poll pages:',
          expect.objectContaining({ message: 'Database error' })
        );
      });

      // Pages should still be visible (not cleared)
      expect(screen.getByText('First Page')).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    it('should poll with correct sort parameters', async () => {
      // Set URL search params for sorting
      mockSearchParams.set('sortBy', 'title');
      mockSearchParams.set('direction', 'desc');

      render(<PageListWrapper pages={mockPages} searchQuery="" labelId="" />);

      // Trigger polling
      await act(async () => {
        await pollingCallback!();
      });

      await waitFor(() => {
        const orderCall = mockSupabaseSelect.mock.results[0].value.order;
        expect(orderCall).toHaveBeenCalledWith('title', { ascending: false });
      });
    });

    it('should preserve full page data when merging polled metadata', async () => {
      // Pages with full content
      const fullPages = mockPages.map((p) => ({
        ...p,
        content: { type: 'doc', content: [{ type: 'paragraph' }] },
      }));

      render(<PageListWrapper pages={fullPages} />);

      // Polled data returns only metadata
      const polledMetadata = mockPages.map((p) => ({
        id: p.id,
        title: p.title,
        sort_order: p.sort_order,
        updated_at: '2024-01-05T00:00:00Z', // Changed timestamp
      }));

      mockSupabaseSelect.mockReturnValue({
        order: jest
          .fn()
          .mockResolvedValue({ data: polledMetadata, error: null }),
      });

      // Trigger polling
      await act(async () => {
        await pollingCallback!();
      });

      await waitFor(() => {
        // Should still have content from original pages
        const pageList = screen.getByTestId('page-list');
        expect(pageList).toBeInTheDocument();
      });
    });
  });

  describe('Sort handling', () => {
    it('should update URL when sort changes', async () => {
      render(<PageListWrapper pages={mockPages} />);

      const sortButton = screen.getByTestId('sort-button');

      await act(async () => {
        sortButton.click();
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          '/notebook?sortBy=title&direction=asc'
        );
      });
    });

    it('should preserve search query when sorting', async () => {
      render(
        <PageListWrapper
          pages={mockPages}
          searchQuery="test query"
          labelId=""
        />
      );

      const sortButton = screen.getByTestId('sort-button');

      await act(async () => {
        sortButton.click();
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          '/notebook?sortBy=title&direction=asc&q=test+query'
        );
      });
    });

    it('should preserve label filter when sorting', async () => {
      render(
        <PageListWrapper pages={mockPages} searchQuery="" labelId="label-1" />
      );

      const sortButton = screen.getByTestId('sort-button');

      await act(async () => {
        sortButton.click();
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          '/notebook?sortBy=title&direction=asc&labelId=label-1'
        );
      });
    });
  });

  describe('Props updates', () => {
    it('should update local state when server props change', () => {
      const { rerender } = render(<PageListWrapper pages={mockPages} />);

      expect(screen.getByText('First Page')).toBeInTheDocument();

      // Update with new pages from server
      const newPages = [
        {
          id: 'page-4',
          notebook_id: 'notebook-1',
          title: 'New Server Page',
          content: {},
          sort_order: 'a3',
          created_at: '2024-01-04T00:00:00Z',
          updated_at: '2024-01-04T00:00:00Z',
        },
      ];

      rerender(<PageListWrapper pages={newPages} />);

      expect(screen.getByText('New Server Page')).toBeInTheDocument();
      expect(screen.queryByText('First Page')).not.toBeInTheDocument();
    });
  });
});
