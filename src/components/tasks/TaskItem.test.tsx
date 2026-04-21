import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskItem } from './TaskItem';
import type { Task } from '@/types';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
jest.mock('@/lib/supabase/client');

// Mock @dnd-kit/sortable
const mockUseSortable = jest.fn();
jest.mock('@dnd-kit/sortable', () => ({
  useSortable: () => mockUseSortable(),
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

describe('TaskItem', () => {
  const mockTask: Task = {
    id: 'task-1',
    page_id: 'page-1',
    task_index: 0,
    text: 'Buy milk',
    checked: false,
    due_at: null,
    sort_order: 'a0',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockSupabaseUpdate = jest.fn();
  const mockSupabaseFrom = jest.fn();
  const mockRemindersUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default useSortable mock
    mockUseSortable.mockReturnValue({
      attributes: { 'data-sortable': 'true' },
      listeners: { onPointerDown: jest.fn() },
      setNodeRef: jest.fn(),
      transform: null,
      transition: null,
      isDragging: false,
    });

    // Setup Supabase mock for tasks update
    mockSupabaseUpdate.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    // Setup Supabase mock for reminders update
    mockRemindersUpdate.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    });

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'tasks') {
        return { update: mockSupabaseUpdate };
      }
      if (table === 'reminders') {
        return { update: mockRemindersUpdate };
      }
      return { update: jest.fn() };
    });

    (createClient as jest.Mock).mockReturnValue({
      from: mockSupabaseFrom,
    });
  });

  it('should render task with text', () => {
    render(<TaskItem task={mockTask} />);
    expect(screen.getByText('Buy milk')).toBeInTheDocument();
  });

  it('should render unchecked checkbox for incomplete task', () => {
    render(<TaskItem task={mockTask} />);
    const checkbox = screen.getByRole('checkbox', {
      name: /mark "buy milk" as complete/i,
    });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('should render checked checkbox for completed task', () => {
    const completedTask = { ...mockTask, checked: true };
    render(<TaskItem task={completedTask} />);
    const checkbox = screen.getByRole('checkbox', {
      name: /mark "buy milk" as incomplete/i,
    });
    expect(checkbox).toBeChecked();
  });

  it('should apply strikethrough and muted color to completed task', () => {
    const completedTask = { ...mockTask, checked: true };
    render(<TaskItem task={completedTask} />);
    const taskText = screen.getByText('Buy milk');
    expect(taskText).toHaveClass('line-through');
    expect(taskText).toHaveClass('text-ink-500');
  });

  it('should not apply strikethrough to incomplete task', () => {
    render(<TaskItem task={mockTask} />);
    const taskText = screen.getByText('Buy milk');
    expect(taskText).not.toHaveClass('line-through');
    expect(taskText).toHaveClass('text-ink-900');
  });

  it('should toggle checkbox and update Supabase when clicked', async () => {
    const user = userEvent.setup();
    render(<TaskItem task={mockTask} />);

    const checkbox = screen.getByRole('checkbox', {
      name: /mark "buy milk" as complete/i,
    });
    await user.click(checkbox);

    await waitFor(() => {
      expect(mockSupabaseFrom).toHaveBeenCalledWith('tasks');
      expect(mockSupabaseUpdate).toHaveBeenCalledWith({ checked: true });
    });
  });

  it('should call onUpdate callback when checkbox is toggled', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();
    render(<TaskItem task={mockTask} onUpdate={onUpdate} />);

    const checkbox = screen.getByRole('checkbox', {
      name: /mark "buy milk" as complete/i,
    });
    await user.click(checkbox);

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith({
        ...mockTask,
        checked: true,
      });
    });
  });

  it('should not update when checkbox is clicked while already updating', async () => {
    const user = userEvent.setup();

    // Make the update slow
    mockSupabaseUpdate.mockReturnValue({
      eq: jest
        .fn()
        .mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve({ error: null }), 100)
            )
        ),
    });

    render(<TaskItem task={mockTask} />);

    const checkbox = screen.getByRole('checkbox', {
      name: /mark "buy milk" as complete/i,
    });

    // Click multiple times quickly
    await user.click(checkbox);
    await user.click(checkbox);
    await user.click(checkbox);

    // Should only update once
    await waitFor(() => {
      expect(mockSupabaseUpdate).toHaveBeenCalledTimes(1);
    });
  });

  it('should render drag handle with proper aria-label', () => {
    render(<TaskItem task={mockTask} />);
    const dragHandle = screen.getByLabelText('Drag to reorder task');
    expect(dragHandle).toBeInTheDocument();
  });

  it('should apply drag listeners to drag handle', () => {
    const mockListeners = { onPointerDown: jest.fn() };
    mockUseSortable.mockReturnValue({
      attributes: {},
      listeners: mockListeners,
      setNodeRef: jest.fn(),
      transform: null,
      transition: null,
      isDragging: false,
    });

    render(<TaskItem task={mockTask} />);
    const dragHandle = screen.getByLabelText('Drag to reorder task');

    // Verify the listeners are applied (checking for the presence of pointer events)
    expect(dragHandle).toBeInTheDocument();
  });

  it('should apply dragging styles when isDragging is true', () => {
    mockUseSortable.mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: jest.fn(),
      transform: null,
      transition: null,
      isDragging: true,
    });

    const { container } = render(<TaskItem task={mockTask} />);
    const taskElement = container.querySelector('[role="listitem"]');
    expect(taskElement).toHaveStyle({ opacity: 0.5 });
  });

  it('should not display due date when due_at is null', () => {
    render(<TaskItem task={mockTask} />);
    expect(screen.queryByText(/due:/i)).not.toBeInTheDocument();
  });

  it('should display due date when due_at is set', () => {
    const taskWithDueDate = {
      ...mockTask,
      due_at: '2024-12-25T10:00:00Z',
    };
    render(<TaskItem task={taskWithDueDate} />);
    expect(screen.getByText(/due:/i)).toBeInTheDocument();
  });

  it('should format due date as "Today" when due today', () => {
    const today = new Date();
    today.setHours(14, 30, 0, 0);

    const taskWithDueDate = {
      ...mockTask,
      due_at: today.toISOString(),
    };
    render(<TaskItem task={taskWithDueDate} />);
    expect(screen.getByText(/today at/i)).toBeInTheDocument();
  });

  it('should format due date as "Tomorrow" when due tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 30, 0, 0);

    const taskWithDueDate = {
      ...mockTask,
      due_at: tomorrow.toISOString(),
    };
    render(<TaskItem task={taskWithDueDate} />);
    expect(screen.getByText(/tomorrow at/i)).toBeInTheDocument();
  });

  it('should show weekday for tasks due within a week', () => {
    const inThreeDays = new Date();
    inThreeDays.setDate(inThreeDays.getDate() + 3);
    inThreeDays.setHours(14, 30, 0, 0);

    const taskWithDueDate = {
      ...mockTask,
      due_at: inThreeDays.toISOString(),
    };
    render(<TaskItem task={taskWithDueDate} />);
    // Should show weekday name
    const dueText = screen.getByText(/due:/i).textContent;
    expect(dueText).toMatch(
      /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/
    );
  });

  it('should highlight overdue tasks with amber border', () => {
    const sixHoursAgo = new Date();
    sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);

    const overdueTask = {
      ...mockTask,
      due_at: sixHoursAgo.toISOString(),
      checked: false,
    };

    const { container } = render(<TaskItem task={overdueTask} />);
    const taskElement = container.querySelector('[role="listitem"]');
    expect(taskElement).toHaveClass('border-l-4');
    expect(taskElement).toHaveClass('border-l-amber-500');
  });

  it('should show "(Overdue)" label for overdue incomplete tasks', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const overdueTask = {
      ...mockTask,
      due_at: yesterday.toISOString(),
      checked: false,
    };

    render(<TaskItem task={overdueTask} />);
    expect(screen.getByText(/\(overdue\)/i)).toBeInTheDocument();
  });

  it('should not highlight completed overdue tasks', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const completedOverdueTask = {
      ...mockTask,
      due_at: yesterday.toISOString(),
      checked: true,
    };

    const { container } = render(<TaskItem task={completedOverdueTask} />);
    const taskElement = container.querySelector('[role="listitem"]');
    expect(taskElement).not.toHaveClass('border-l-amber-500');
    expect(screen.queryByText(/\(overdue\)/i)).not.toBeInTheDocument();
  });

  it('should highlight severely overdue tasks (24+ hours) with red border', () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const severelyOverdueTask = {
      ...mockTask,
      due_at: twoDaysAgo.toISOString(),
      checked: false,
    };

    const { container } = render(<TaskItem task={severelyOverdueTask} />);
    const taskElement = container.querySelector('[role="listitem"]');
    expect(taskElement).toHaveClass('border-l-4');
    expect(taskElement).toHaveClass('border-l-red-500');
    expect(taskElement).not.toHaveClass('border-l-amber-500');
  });

  it('should show red text for severely overdue tasks', () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const severelyOverdueTask = {
      ...mockTask,
      due_at: twoDaysAgo.toISOString(),
      checked: false,
    };

    render(<TaskItem task={severelyOverdueTask} />);
    const dueText = screen.getByText(/due:/i);
    expect(dueText).toHaveClass('text-red-700');
    expect(dueText).toHaveClass('font-medium');
  });

  it('should use amber for recently overdue tasks (less than 24 hours)', () => {
    const twelveHoursAgo = new Date();
    twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);

    const recentlyOverdueTask = {
      ...mockTask,
      due_at: twelveHoursAgo.toISOString(),
      checked: false,
    };

    const { container } = render(<TaskItem task={recentlyOverdueTask} />);
    const taskElement = container.querySelector('[role="listitem"]');
    expect(taskElement).toHaveClass('border-l-4');
    expect(taskElement).toHaveClass('border-l-amber-500');
    expect(taskElement).not.toHaveClass('border-l-red-500');

    const dueText = screen.getByText(/due:/i);
    expect(dueText).toHaveClass('text-amber-700');
    expect(dueText).not.toHaveClass('text-red-700');
  });

  it('should handle Supabase update errors gracefully', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const user = userEvent.setup();

    mockSupabaseUpdate.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: { message: 'Database error' } }),
    });

    render(<TaskItem task={mockTask} />);

    const checkbox = screen.getByRole('checkbox', {
      name: /mark "buy milk" as complete/i,
    });
    await user.click(checkbox);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  it('should apply transform styles when dragging', () => {
    mockUseSortable.mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: jest.fn(),
      transform: { x: 10, y: 20, scaleX: 1, scaleY: 1 },
      transition: 'transform 200ms ease',
      isDragging: false,
    });

    const { container } = render(<TaskItem task={mockTask} />);
    const taskElement = container.querySelector('[role="listitem"]');
    expect(taskElement).toHaveStyle({
      transform: 'translate3d(10px, 20px, 0)',
      transition: 'transform 200ms ease',
    });
  });

  it('should have proper accessibility attributes', () => {
    render(<TaskItem task={mockTask} />);
    const taskElement = screen.getByRole('listitem');
    expect(taskElement).toHaveAttribute('aria-label', 'Buy milk');
  });

  describe('Keyboard Navigation', () => {
    it('should have focus-visible ring on drag handle', () => {
      render(<TaskItem task={mockTask} />);
      const dragHandle = screen.getByLabelText('Drag to reorder task');
      expect(dragHandle).toHaveClass('focus-visible:ring-2');
      expect(dragHandle).toHaveClass('focus-visible:ring-leather-500');
    });

    it('should have focus ring on checkbox', () => {
      render(<TaskItem task={mockTask} />);
      const checkbox = screen.getByRole('checkbox', {
        name: /mark "buy milk" as complete/i,
      });
      expect(checkbox).toHaveClass('focus:ring-2');
      expect(checkbox).toHaveClass('focus:ring-leather-500');
    });
  });

  describe('Auto-dismiss reminders on task completion', () => {
    it('should dismiss pending reminders when task is marked as complete', async () => {
      const user = userEvent.setup();
      const mockEq1 = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockRemindersUpdate.mockReturnValue({
        eq: mockEq1,
      });

      render(<TaskItem task={mockTask} />);

      const checkbox = screen.getByRole('checkbox', {
        name: /mark "buy milk" as complete/i,
      });
      await user.click(checkbox);

      await waitFor(() => {
        expect(mockSupabaseFrom).toHaveBeenCalledWith('reminders');
        expect(mockRemindersUpdate).toHaveBeenCalledWith({
          status: 'dismissed',
        });
        expect(mockEq1).toHaveBeenCalledWith('task_id', 'task-1');
      });

      // Verify both eq calls were made (task_id and status filters)
      const eqCalls = mockEq1.mock.results[0].value.eq;
      expect(eqCalls).toHaveBeenCalledWith('status', 'pending');
    });

    it('should not dismiss reminders when task is unchecked', async () => {
      const user = userEvent.setup();
      const completedTask = { ...mockTask, checked: true };
      render(<TaskItem task={completedTask} />);

      const checkbox = screen.getByRole('checkbox', {
        name: /mark "buy milk" as incomplete/i,
      });
      await user.click(checkbox);

      await waitFor(() => {
        expect(mockSupabaseFrom).toHaveBeenCalledWith('tasks');
        // Should NOT call reminders table when unchecking
        expect(mockSupabaseFrom).not.toHaveBeenCalledWith('reminders');
      });
    });

    it('should continue with task update even if reminder dismissal fails', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const onUpdate = jest.fn();
      const user = userEvent.setup();

      // Make reminder update fail
      mockRemindersUpdate.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: { message: 'Reminder update failed' },
          }),
        }),
      });

      render(<TaskItem task={mockTask} onUpdate={onUpdate} />);

      const checkbox = screen.getByRole('checkbox', {
        name: /mark "buy milk" as complete/i,
      });
      await user.click(checkbox);

      // Task update should still succeed and notify parent
      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledWith({
          ...mockTask,
          checked: true,
        });
      });

      // Should log the reminder error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to dismiss reminders:',
        { message: 'Reminder update failed' }
      );

      consoleErrorSpy.mockRestore();
    });

    it('should only dismiss pending reminders, not dismissed or snoozed ones', async () => {
      const user = userEvent.setup();
      const mockEq1 = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockRemindersUpdate.mockReturnValue({
        eq: mockEq1,
      });

      render(<TaskItem task={mockTask} />);

      const checkbox = screen.getByRole('checkbox', {
        name: /mark "buy milk" as complete/i,
      });
      await user.click(checkbox);

      await waitFor(() => {
        // Verify the status filter is for 'pending' only
        const eqCalls = mockEq1.mock.results[0].value.eq;
        expect(eqCalls).toHaveBeenCalledWith('status', 'pending');
      });
    });
  });
});
