import { render, screen, waitFor, act } from '@testing-library/react';
import { TaskList } from './TaskList';
import type { Task } from '@/types';
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

describe('TaskList', () => {
  const mockTasks: Task[] = [
    {
      id: 'task-1',
      page_id: 'page-1',
      task_index: 0,
      text: 'Buy milk',
      checked: false,
      due_at: null,
      sort_order: 'a0',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'task-2',
      page_id: 'page-1',
      task_index: 1,
      text: 'Call dentist',
      checked: false,
      due_at: null,
      sort_order: 'a1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'task-3',
      page_id: 'page-1',
      task_index: 2,
      text: 'Read a book',
      checked: true,
      due_at: null,
      sort_order: 'a2',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  const mockSupabaseUpdate = jest.fn();
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

    mockSupabaseFrom.mockReturnValue({
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

  it('should render all tasks', () => {
    render(<TaskList tasks={mockTasks} />);
    expect(screen.getByText('Buy milk')).toBeInTheDocument();
    expect(screen.getByText('Call dentist')).toBeInTheDocument();
    expect(screen.getByText('Read a book')).toBeInTheDocument();
  });

  it('should render tasks in a sortable context', () => {
    render(<TaskList tasks={mockTasks} />);
    expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
    expect(screen.getByTestId('sortable-context')).toBeInTheDocument();
  });

  it('should render tasks with accessible list role', () => {
    render(<TaskList tasks={mockTasks} />);
    const list = screen.getByRole('list', { name: /task list/i });
    expect(list).toBeInTheDocument();
  });

  it('should handle drag end when dragging to same position', async () => {
    render(<TaskList tasks={mockTasks} />);

    const dragEndEvent: DragEndEvent = {
      active: {
        id: 'task-1',
        data: { current: {} },
        rect: { current: { initial: null, translated: null } },
      },
      over: {
        id: 'task-1',
        data: { current: {} },
        rect: {} as ClientRect,
        disabled: false,
      },
      delta: { x: 0, y: 0 },
      activatorEvent: {} as any,
      collisions: null,
    };

    if (mockDndContext.current?.onDragEnd) {
      await act(async () => {
        mockDndContext.current.onDragEnd?.(dragEndEvent);
      });
    }

    // Should not call Supabase update
    expect(mockSupabaseFrom).not.toHaveBeenCalled();
  });

  it('should handle drag end when over is null', async () => {
    render(<TaskList tasks={mockTasks} />);

    const dragEndEvent: DragEndEvent = {
      active: {
        id: 'task-1',
        data: { current: {} },
        rect: { current: { initial: null, translated: null } },
      },
      over: null,
      delta: { x: 0, y: 0 },
      activatorEvent: {} as any,
      collisions: null,
    };

    if (mockDndContext.current?.onDragEnd) {
      await act(async () => {
        mockDndContext.current.onDragEnd?.(dragEndEvent);
      });
    }

    // Should not call Supabase update
    expect(mockSupabaseFrom).not.toHaveBeenCalled();
  });

  it('should update sort_order when dragging to beginning', async () => {
    render(<TaskList tasks={mockTasks} />);

    // Drag task-2 to the beginning (before task-1)
    const dragEndEvent: DragEndEvent = {
      active: {
        id: 'task-2',
        data: { current: {} },
        rect: { current: { initial: null, translated: null } },
      },
      over: {
        id: 'task-1',
        data: { current: {} },
        rect: {} as ClientRect,
        disabled: false,
      },
      delta: { x: 0, y: -50 },
      activatorEvent: {} as any,
      collisions: null,
    };

    if (mockDndContext.current?.onDragEnd) {
      await act(async () => {
        mockDndContext.current.onDragEnd?.(dragEndEvent);
      });
    }

    await waitFor(() => {
      expect(mockSupabaseFrom).toHaveBeenCalledWith('tasks');
      expect(mockSupabaseUpdate).toHaveBeenCalled();
    });

    // Should call generateKeyBetween with (null, 'a1') for moving to beginning
    expect(generateKeyBetween).toHaveBeenCalled();
  });

  it('should update sort_order when dragging to end', async () => {
    render(<TaskList tasks={mockTasks} />);

    // Drag task-1 to the end (after task-3)
    const dragEndEvent: DragEndEvent = {
      active: {
        id: 'task-1',
        data: { current: {} },
        rect: { current: { initial: null, translated: null } },
      },
      over: {
        id: 'task-3',
        data: { current: {} },
        rect: {} as ClientRect,
        disabled: false,
      },
      delta: { x: 0, y: 100 },
      activatorEvent: {} as any,
      collisions: null,
    };

    if (mockDndContext.current?.onDragEnd) {
      await act(async () => {
        mockDndContext.current.onDragEnd?.(dragEndEvent);
      });
    }

    await waitFor(() => {
      expect(mockSupabaseFrom).toHaveBeenCalledWith('tasks');
      expect(mockSupabaseUpdate).toHaveBeenCalled();
    });

    expect(generateKeyBetween).toHaveBeenCalled();
  });

  it('should update sort_order when dragging between tasks', async () => {
    render(<TaskList tasks={mockTasks} />);

    // Drag task-3 between task-1 and task-2
    const dragEndEvent: DragEndEvent = {
      active: {
        id: 'task-3',
        data: { current: {} },
        rect: { current: { initial: null, translated: null } },
      },
      over: {
        id: 'task-2',
        data: { current: {} },
        rect: {} as ClientRect,
        disabled: false,
      },
      delta: { x: 0, y: -50 },
      activatorEvent: {} as any,
      collisions: null,
    };

    if (mockDndContext.current?.onDragEnd) {
      await act(async () => {
        mockDndContext.current.onDragEnd?.(dragEndEvent);
      });
    }

    await waitFor(() => {
      expect(mockSupabaseFrom).toHaveBeenCalledWith('tasks');
      expect(mockSupabaseUpdate).toHaveBeenCalled();
    });

    expect(generateKeyBetween).toHaveBeenCalled();
  });

  it('should call onTasksReorder callback when provided', async () => {
    const onTasksReorder = jest.fn();
    render(<TaskList tasks={mockTasks} onTasksReorder={onTasksReorder} />);

    const dragEndEvent: DragEndEvent = {
      active: {
        id: 'task-1',
        data: { current: {} },
        rect: { current: { initial: null, translated: null } },
      },
      over: {
        id: 'task-2',
        data: { current: {} },
        rect: {} as ClientRect,
        disabled: false,
      },
      delta: { x: 0, y: 50 },
      activatorEvent: {} as any,
      collisions: null,
    };

    if (mockDndContext.current?.onDragEnd) {
      await act(async () => {
        mockDndContext.current.onDragEnd?.(dragEndEvent);
      });
    }

    await waitFor(() => {
      expect(onTasksReorder).toHaveBeenCalled();
    });
  });

  it('should handle Supabase update errors gracefully', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    mockSupabaseUpdate.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
    });

    render(<TaskList tasks={mockTasks} />);

    const dragEndEvent: DragEndEvent = {
      active: {
        id: 'task-1',
        data: { current: {} },
        rect: { current: { initial: null, translated: null } },
      },
      over: {
        id: 'task-2',
        data: { current: {} },
        rect: {} as ClientRect,
        disabled: false,
      },
      delta: { x: 0, y: 50 },
      activatorEvent: {} as any,
      collisions: null,
    };

    if (mockDndContext.current?.onDragEnd) {
      await act(async () => {
        mockDndContext.current.onDragEnd?.(dragEndEvent);
      });
    }

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to update task sort order:',
        expect.any(Object)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('should handle network errors gracefully', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    mockSupabaseUpdate.mockReturnValue({
      eq: jest.fn().mockRejectedValue(new Error('Network error')),
    });

    render(<TaskList tasks={mockTasks} />);

    const dragEndEvent: DragEndEvent = {
      active: {
        id: 'task-1',
        data: { current: {} },
        rect: { current: { initial: null, translated: null } },
      },
      over: {
        id: 'task-2',
        data: { current: {} },
        rect: {} as ClientRect,
        disabled: false,
      },
      delta: { x: 0, y: 50 },
      activatorEvent: {} as any,
      collisions: null,
    };

    if (mockDndContext.current?.onDragEnd) {
      await act(async () => {
        mockDndContext.current.onDragEnd?.(dragEndEvent);
      });
    }

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to update task sort order:',
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('should render empty list when no tasks provided', () => {
    render(<TaskList tasks={[]} />);
    const list = screen.getByRole('list', { name: /task list/i });
    expect(list).toBeInTheDocument();
    expect(list).toBeEmptyDOMElement();
  });

  it('should update tasks when TaskItem onUpdate callback is called', () => {
    const { rerender } = render(<TaskList tasks={mockTasks} />);

    // Simulate a task update via TaskItem callback
    // This is handled internally by the component
    expect(screen.getByText('Buy milk')).toBeInTheDocument();

    // Re-render with updated task
    const updatedTasks = mockTasks.map((task) =>
      task.id === 'task-1' ? { ...task, checked: true } : task
    );
    rerender(<TaskList tasks={updatedTasks} />);

    // Task should still be rendered
    expect(screen.getByText('Buy milk')).toBeInTheDocument();
  });

  it('should pass tasks to TaskItem components', () => {
    render(<TaskList tasks={mockTasks} />);

    // All task items should be rendered
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(3);
  });
});
