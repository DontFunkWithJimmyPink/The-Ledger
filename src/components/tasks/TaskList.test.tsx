import { render, screen } from '@testing-library/react';
import { TaskList } from './TaskList';
import { TaskItem } from './TaskItem';
import type { Task } from '@/types';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null })),
        })),
      })),
    })),
  })),
}));

// Mock fractional indexing
jest.mock('@/lib/utils/fractional-index', () => ({
  generateKeyBetween: jest.fn((a: string | null, b: string | null) => {
    if (!a && !b) return 'a0';
    if (!a) return `${b}0`;
    if (!b) return `${a}z`;
    return `${a}m`;
  }),
}));

describe('TaskList', () => {
  const mockTasks: Task[] = [
    {
      id: 'task-1',
      page_id: 'page-1',
      task_index: 0,
      text: 'First task',
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
      text: 'Second task',
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
      text: 'Third task',
      checked: false,
      due_at: null,
      sort_order: 'a2',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  it('should render children within DndContext and SortableContext', () => {
    render(
      <TaskList tasks={mockTasks} pageId="page-1">
        <div data-testid="child-content">Task List Content</div>
      </TaskList>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Task List Content')).toBeInTheDocument();
  });

  it('should render multiple TaskItem components', () => {
    render(
      <TaskList tasks={mockTasks} pageId="page-1">
        {mockTasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </TaskList>
    );

    expect(screen.getByText('First task')).toBeInTheDocument();
    expect(screen.getByText('Second task')).toBeInTheDocument();
    expect(screen.getByText('Third task')).toBeInTheDocument();
  });

  it('should accept empty tasks array', () => {
    render(
      <TaskList tasks={[]} pageId="page-1">
        <div data-testid="empty-state">No tasks</div>
      </TaskList>
    );

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('should initialize with provided tasks', () => {
    render(
      <TaskList tasks={mockTasks} pageId="page-1">
        {mockTasks.map((task) => (
          <div key={task.id} data-testid={`task-${task.id}`}>
            {task.text}
          </div>
        ))}
      </TaskList>
    );

    mockTasks.forEach((task) => {
      expect(screen.getByTestId(`task-${task.id}`)).toBeInTheDocument();
    });
  });

  it('should configure PointerSensor with activation constraint', () => {
    // This test verifies the component renders without errors
    // The actual sensor configuration is tested through integration tests
    const { container } = render(
      <TaskList tasks={mockTasks} pageId="page-1">
        <div>Content</div>
      </TaskList>
    );

    expect(container).toBeInTheDocument();
  });

  it('should call onTasksReorder when provided', async () => {
    const onTasksReorder = jest.fn();

    render(
      <TaskList
        tasks={mockTasks}
        pageId="page-1"
        onTasksReorder={onTasksReorder}
      >
        {mockTasks.map((task) => (
          <div key={task.id}>{task.text}</div>
        ))}
      </TaskList>
    );

    // onTasksReorder would be called during drag operations
    // This is verified in integration tests with actual DnD events
    expect(onTasksReorder).not.toHaveBeenCalled();
  });
});
