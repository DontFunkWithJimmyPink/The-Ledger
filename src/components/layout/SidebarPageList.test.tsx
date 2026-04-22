import { render, screen, waitFor, act } from '@testing-library/react';
import { SidebarPageList } from './SidebarPageList';
import type { Page } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { generateKeyBetween } from '@/lib/utils/fractional-index';
import type { DragEndEvent } from '@dnd-kit/core';

// Mock Supabase client
jest.mock('@/lib/supabase/client');

// Mock fractional-index utility
jest.mock('@/lib/utils/fractional-index');

// Mock @dnd-kit/sortable
const mockUseSortable = jest.fn();
jest.mock('@dnd-kit/sortable', () => ({
  useSortable: () => mockUseSortable(),
  SortableContext: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sortable-context">{children}</div>
  ),
  verticalListSortingStrategy: {},
  arrayMove: (arr: any[], oldIndex: number, newIndex: number) => {
    const result = [...arr];
    const [removed] = result.splice(oldIndex, 1);
    result.splice(newIndex, 0, removed);
    return result;
  },
}));

// Mock @dnd-kit/core
const mockDndContext: {
  current: { onDragEnd?: (event: DragEndEvent) => void };
} = { current: {} };
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragEnd }: any) => {
    mockDndContext.current = { onDragEnd };
    return <div data-testid="dnd-context">{children}</div>;
  },
  closestCenter: {},
  PointerSensor: class {},
  useSensor: jest.fn(),
  useSensors: jest.fn(() => []),
}));

// Mock @dnd-kit/utilities
jest.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: (transform: any) => {
        if (!transform) return '';
        return `translate3d(${transform.x}px, ${transform.y}px, 0)`;
      },
    },
  },
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/notebook'),
}));

describe('SidebarPageList', () => {
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

  const mockSupabaseUpdate = jest.fn();
  const mockSupabaseSelect = jest.fn();
  const mockSupabaseFrom = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockDndContext.current = {};

    // Setup default useSortable mock
    mockUseSortable.mockReturnValue({
      attributes: { 'data-sortable': 'true' },
      listeners: { onPointerDown: jest.fn() },
      setNodeRef: jest.fn(),
      transform: null,
      transition: null,
      isDragging: false,
    });

    // Setup Supabase mock
    mockSupabaseUpdate.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    mockSupabaseSelect.mockReturnValue({
      order: jest.fn().mockResolvedValue({ data: mockPages, error: null }),
    });

    mockSupabaseFrom.mockReturnValue({
      select: mockSupabaseSelect,
      update: mockSupabaseUpdate,
    });

    (createClient as jest.Mock).mockReturnValue({
      from: mockSupabaseFrom,
    });

    // Setup generateKeyBetween mock
    (generateKeyBetween as jest.Mock).mockImplementation(
      (a: string | null, b: string | null) => {
        if (a === null && b === null) return 'a0';
        if (a === null) return `${b}0`;
        if (b === null) return `${a}z`;
        return `${a}${b}`;
      }
    );
  });

  it('should render loading state initially', () => {
    render(<SidebarPageList />);
    // Loading state shows animated skeleton
    const loadingElements = document.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('should fetch and render pages', async () => {
    render(<SidebarPageList />);

    await waitFor(() => {
      expect(screen.getByText('First Page')).toBeInTheDocument();
      expect(screen.getByText('Second Page')).toBeInTheDocument();
      expect(screen.getByText('Third Page')).toBeInTheDocument();
    });
  });

  it('should render pages in a sortable context', async () => {
    render(<SidebarPageList />);

    await waitFor(() => {
      expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
      expect(screen.getByTestId('sortable-context')).toBeInTheDocument();
    });
  });

  it('should render pages with accessible list role', async () => {
    render(<SidebarPageList />);

    await waitFor(() => {
      const list = screen.getByRole('list', { name: /pages/i });
      expect(list).toBeInTheDocument();
    });
  });

  it('should render empty state when no pages exist', async () => {
    mockSupabaseSelect.mockReturnValue({
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    });

    render(<SidebarPageList />);

    await waitFor(() => {
      expect(screen.getByText('No pages yet')).toBeInTheDocument();
    });
  });

  it('should update sort_order when page is dragged to beginning', async () => {
    render(<SidebarPageList />);

    await waitFor(() => {
      expect(screen.getByText('First Page')).toBeInTheDocument();
    });

    // Simulate drag from index 1 to index 0
    const dragEndEvent: DragEndEvent = {
      active: {
        id: 'page-2',
        data: { current: undefined },
        rect: { current: { initial: null, translated: null } },
      },
      over: {
        id: 'page-1',
        data: { current: undefined },
        rect: { width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 },
        disabled: false,
      },
      delta: { x: 0, y: 0 },
      collisions: null,
      activatorEvent: new MouseEvent('mousedown'),
    };

    await act(async () => {
      mockDndContext.current.onDragEnd?.(dragEndEvent);
    });

    await waitFor(() => {
      expect(generateKeyBetween).toHaveBeenCalledWith(null, 'a0');
      expect(mockSupabaseUpdate).toHaveBeenCalledWith({
        sort_order: 'a00',
      });
    });
  });

  it('should update sort_order when page is dragged to end', async () => {
    render(<SidebarPageList />);

    await waitFor(() => {
      expect(screen.getByText('First Page')).toBeInTheDocument();
    });

    // Simulate drag from index 0 to index 2
    const dragEndEvent: DragEndEvent = {
      active: {
        id: 'page-1',
        data: { current: undefined },
        rect: { current: { initial: null, translated: null } },
      },
      over: {
        id: 'page-3',
        data: { current: undefined },
        rect: { width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 },
        disabled: false,
      },
      delta: { x: 0, y: 0 },
      collisions: null,
      activatorEvent: new MouseEvent('mousedown'),
    };

    await act(async () => {
      mockDndContext.current.onDragEnd?.(dragEndEvent);
    });

    await waitFor(() => {
      expect(generateKeyBetween).toHaveBeenCalledWith('a2', null);
      expect(mockSupabaseUpdate).toHaveBeenCalledWith({
        sort_order: 'a2z',
      });
    });
  });

  it('should update sort_order when page is dragged between two pages', async () => {
    render(<SidebarPageList />);

    await waitFor(() => {
      expect(screen.getByText('First Page')).toBeInTheDocument();
    });

    // Simulate drag from index 0 to index 1
    const dragEndEvent: DragEndEvent = {
      active: {
        id: 'page-1',
        data: { current: undefined },
        rect: { current: { initial: null, translated: null } },
      },
      over: {
        id: 'page-2',
        data: { current: undefined },
        rect: { width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 },
        disabled: false,
      },
      delta: { x: 0, y: 0 },
      collisions: null,
      activatorEvent: new MouseEvent('mousedown'),
    };

    await act(async () => {
      mockDndContext.current.onDragEnd?.(dragEndEvent);
    });

    await waitFor(() => {
      expect(generateKeyBetween).toHaveBeenCalledWith('a1', 'a2');
      expect(mockSupabaseUpdate).toHaveBeenCalledWith({
        sort_order: 'a1a2',
      });
    });
  });

  it('should not update when page is dropped on itself', async () => {
    render(<SidebarPageList />);

    await waitFor(() => {
      expect(screen.getByText('First Page')).toBeInTheDocument();
    });

    const dragEndEvent: DragEndEvent = {
      active: {
        id: 'page-1',
        data: { current: undefined },
        rect: { current: { initial: null, translated: null } },
      },
      over: {
        id: 'page-1',
        data: { current: undefined },
        rect: { width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 },
        disabled: false,
      },
      delta: { x: 0, y: 0 },
      collisions: null,
      activatorEvent: new MouseEvent('mousedown'),
    };

    await act(async () => {
      mockDndContext.current.onDragEnd?.(dragEndEvent);
    });

    expect(generateKeyBetween).not.toHaveBeenCalled();
    expect(mockSupabaseUpdate).not.toHaveBeenCalled();
  });

  it('should revert optimistic update on error', async () => {
    render(<SidebarPageList />);

    await waitFor(() => {
      expect(screen.getByText('First Page')).toBeInTheDocument();
    });

    // Setup error response
    mockSupabaseUpdate.mockReturnValue({
      eq: jest.fn().mockResolvedValue({
        error: { message: 'Database error' },
      }),
    });

    const dragEndEvent: DragEndEvent = {
      active: {
        id: 'page-1',
        data: { current: undefined },
        rect: { current: { initial: null, translated: null } },
      },
      over: {
        id: 'page-2',
        data: { current: undefined },
        rect: { width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 },
        disabled: false,
      },
      delta: { x: 0, y: 0 },
      collisions: null,
      activatorEvent: new MouseEvent('mousedown'),
    };

    await act(async () => {
      mockDndContext.current.onDragEnd?.(dragEndEvent);
    });

    // Should still render original order
    await waitFor(() => {
      expect(screen.getByText('First Page')).toBeInTheDocument();
      expect(screen.getByText('Second Page')).toBeInTheDocument();
    });
  });
});
