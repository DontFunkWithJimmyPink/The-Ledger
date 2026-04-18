import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskItem } from './TaskItem';
import type { Task } from '@/types';

// Mock Supabase client
const mockUpdate = jest.fn(() => ({
  eq: jest.fn(() => Promise.resolve({ error: null })),
}));

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      update: mockUpdate,
    })),
  })),
}));

// Mock @dnd-kit/sortable
jest.mock('@dnd-kit/sortable', () => ({
  useSortable: jest.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
}));

// Mock @dnd-kit/utilities
jest.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: jest.fn(() => ''),
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render task text', () => {
    render(<TaskItem task={mockTask} />);
    expect(screen.getByText('Buy milk')).toBeInTheDocument();
  });

  it('should render unchecked checkbox for incomplete task', () => {
    render(<TaskItem task={mockTask} />);
    const checkbox = screen.getByRole('checkbox', {
      name: /mark task "buy milk" as complete/i,
    });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('should render checked checkbox for completed task', () => {
    const completedTask = { ...mockTask, checked: true };
    render(<TaskItem task={completedTask} />);
    const checkbox = screen.getByRole('checkbox', {
      name: /mark task "buy milk" as incomplete/i,
    });
    expect(checkbox).toBeChecked();
  });

  it('should apply strikethrough style to completed tasks', () => {
    const completedTask = { ...mockTask, checked: true };
    render(<TaskItem task={completedTask} />);
    const taskText = screen.getByText('Buy milk');
    expect(taskText).toHaveClass('line-through');
    expect(taskText).toHaveClass('text-ink-500');
  });

  it('should not apply strikethrough to incomplete tasks', () => {
    render(<TaskItem task={mockTask} />);
    const taskText = screen.getByText('Buy milk');
    expect(taskText).not.toHaveClass('line-through');
    expect(taskText).toHaveClass('text-ink-900');
  });

  it('should update task checked state on checkbox change', async () => {
    render(<TaskItem task={mockTask} />);
    const checkbox = screen.getByRole('checkbox');

    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({ checked: true });
    });
  });

  it('should call onTaskUpdate when task is updated', async () => {
    const onTaskUpdate = jest.fn();
    render(<TaskItem task={mockTask} onTaskUpdate={onTaskUpdate} />);
    const checkbox = screen.getByRole('checkbox');

    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(onTaskUpdate).toHaveBeenCalledWith({ ...mockTask, checked: true });
    });
  });

  it('should render drag handle button', () => {
    render(<TaskItem task={mockTask} />);
    const dragHandle = screen.getByLabelText('Drag to reorder');
    expect(dragHandle).toBeInTheDocument();
  });

  it('should not display due date when due_at is null', () => {
    render(<TaskItem task={mockTask} />);
    const container = screen.getByText('Buy milk').parentElement;
    expect(container?.textContent).toBe('Buy milk');
  });

  it('should display due date when due_at is set', () => {
    const taskWithDueDate = {
      ...mockTask,
      due_at: '2024-12-25T00:00:00Z',
    };
    render(<TaskItem task={taskWithDueDate} />);
    expect(screen.getByText(/dec/i)).toBeInTheDocument();
  });

  it('should display overdue warning for past due dates on incomplete tasks', () => {
    const overdueTask = {
      ...mockTask,
      due_at: '2020-01-01T00:00:00Z', // Past date
      checked: false,
    };
    render(<TaskItem task={overdueTask} />);
    const dueDateElement = screen.getByText(/jan/i);
    expect(dueDateElement).toHaveClass('text-red-600');
  });

  it('should not display overdue warning for completed tasks', () => {
    const completedOverdueTask = {
      ...mockTask,
      due_at: '2020-01-01T00:00:00Z', // Past date
      checked: true,
    };
    render(<TaskItem task={completedOverdueTask} />);
    const dueDateElement = screen.getByText(/jan/i);
    expect(dueDateElement).not.toHaveClass('text-red-600');
  });

  it('should revert checked state on update failure', async () => {
    // Mock update failure
    const mockUpdateWithError = jest.fn(() => ({
      eq: jest.fn(() =>
        Promise.resolve({ error: { message: 'Update failed' } })
      ),
    }));

    // Temporarily replace the mock
    const { createClient } = require('@/lib/supabase/client');
    createClient.mockReturnValueOnce({
      from: jest.fn(() => ({
        update: mockUpdateWithError,
      })),
    });

    render(<TaskItem task={mockTask} />);
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;

    expect(checkbox.checked).toBe(false);
    fireEvent.click(checkbox);

    // Initially optimistically updated
    expect(checkbox.checked).toBe(true);

    // Should revert after error
    await waitFor(() => {
      expect(checkbox.checked).toBe(false);
    });
  });

  it('should disable checkbox while updating', async () => {
    render(<TaskItem task={mockTask} />);
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;

    fireEvent.click(checkbox);

    // Should be disabled during update
    expect(checkbox).toBeDisabled();

    await waitFor(() => {
      expect(checkbox).not.toBeDisabled();
    });
  });
});
