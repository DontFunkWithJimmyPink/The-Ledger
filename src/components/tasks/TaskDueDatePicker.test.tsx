import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskDueDatePicker } from './TaskDueDatePicker';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
jest.mock('@/lib/supabase/client');

describe('TaskDueDatePicker', () => {
  const mockTaskId = 'task-123';
  const mockUserId = 'user-456';
  const mockOnUpdate = jest.fn();

  const mockSupabaseUpdate = jest.fn();
  const mockSupabaseInsert = jest.fn();
  const mockSupabaseFrom = jest.fn();
  const mockSupabaseAuth = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup Supabase mock for task update
    mockSupabaseUpdate.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    // Setup Supabase mock for reminder insert
    mockSupabaseInsert.mockResolvedValue({ error: null });

    // Setup Supabase mock for from()
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'tasks') {
        return {
          update: mockSupabaseUpdate,
        };
      }
      if (table === 'reminders') {
        return {
          insert: mockSupabaseInsert,
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          }),
        };
      }
      return {};
    });

    // Setup Supabase auth mock
    mockSupabaseAuth.mockReturnValue({
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      }),
    });

    (createClient as jest.Mock).mockReturnValue({
      from: mockSupabaseFrom,
      auth: mockSupabaseAuth(),
    });
  });

  it('should render calendar button', () => {
    render(
      <TaskDueDatePicker
        taskId={mockTaskId}
        currentDueAt={null}
        onUpdate={mockOnUpdate}
      />
    );
    const button = screen.getByRole('button', {
      name: /set due date and time/i,
    });
    expect(button).toBeInTheDocument();
  });

  it('should open popover when calendar button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TaskDueDatePicker
        taskId={mockTaskId}
        currentDueAt={null}
        onUpdate={mockOnUpdate}
      />
    );

    const button = screen.getByRole('button', {
      name: /set due date and time/i,
    });
    await user.click(button);

    expect(
      screen.getByRole('dialog', { name: /set due date/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/due date & time/i)).toBeInTheDocument();
  });

  it('should render datetime-local input in popover', async () => {
    const user = userEvent.setup();
    render(
      <TaskDueDatePicker
        taskId={mockTaskId}
        currentDueAt={null}
        onUpdate={mockOnUpdate}
      />
    );

    const button = screen.getByRole('button', {
      name: /set due date and time/i,
    });
    await user.click(button);

    const input = screen.getByLabelText(/due date & time/i);
    expect(input).toHaveAttribute('type', 'datetime-local');
  });

  it('should display current due date in input when provided', async () => {
    const user = userEvent.setup();
    const currentDueAt = '2024-12-25T14:30:00Z';

    render(
      <TaskDueDatePicker
        taskId={mockTaskId}
        currentDueAt={currentDueAt}
        onUpdate={mockOnUpdate}
      />
    );

    const button = screen.getByRole('button', {
      name: /set due date and time/i,
    });
    await user.click(button);

    const input = screen.getByLabelText(/due date & time/i) as HTMLInputElement;
    // Input should be populated with local datetime format
    expect(input.value).toContain('2024-12-25');
  });

  it('should update task due_at when confirm is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TaskDueDatePicker
        taskId={mockTaskId}
        currentDueAt={null}
        onUpdate={mockOnUpdate}
      />
    );

    // Open popover
    const button = screen.getByRole('button', {
      name: /set due date and time/i,
    });
    await user.click(button);

    // Set datetime
    const input = screen.getByLabelText(/due date & time/i);
    await user.clear(input);
    await user.type(input, '2024-12-25T14:30');

    // Click confirm
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockSupabaseUpdate).toHaveBeenCalledWith({
        due_at: expect.stringContaining('2024-12-25'),
      });
    });
  });

  it('should insert reminder when confirm is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TaskDueDatePicker
        taskId={mockTaskId}
        currentDueAt={null}
        onUpdate={mockOnUpdate}
      />
    );

    // Open popover
    const button = screen.getByRole('button', {
      name: /set due date and time/i,
    });
    await user.click(button);

    // Set datetime
    const input = screen.getByLabelText(/due date & time/i);
    await user.clear(input);
    await user.type(input, '2024-12-25T14:30');

    // Click confirm
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockSupabaseInsert).toHaveBeenCalledWith({
        user_id: mockUserId,
        task_id: mockTaskId,
        fire_at: expect.stringContaining('2024-12-25'),
        status: 'pending',
      });
    });
  });

  it('should call onUpdate callback after successful save', async () => {
    const user = userEvent.setup();
    render(
      <TaskDueDatePicker
        taskId={mockTaskId}
        currentDueAt={null}
        onUpdate={mockOnUpdate}
      />
    );

    // Open popover
    const button = screen.getByRole('button', {
      name: /set due date and time/i,
    });
    await user.click(button);

    // Set datetime
    const input = screen.getByLabelText(/due date & time/i);
    await user.clear(input);
    await user.type(input, '2024-12-25T14:30');

    // Click confirm
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.stringContaining('2024-12-25')
      );
    });
  });

  it('should close popover after successful save', async () => {
    const user = userEvent.setup();
    render(
      <TaskDueDatePicker
        taskId={mockTaskId}
        currentDueAt={null}
        onUpdate={mockOnUpdate}
      />
    );

    // Open popover
    const button = screen.getByRole('button', {
      name: /set due date and time/i,
    });
    await user.click(button);

    // Set datetime
    const input = screen.getByLabelText(/due date & time/i);
    await user.clear(input);
    await user.type(input, '2024-12-25T14:30');

    // Click confirm
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('should show error when confirm is clicked without date', async () => {
    const user = userEvent.setup();
    render(
      <TaskDueDatePicker
        taskId={mockTaskId}
        currentDueAt={null}
        onUpdate={mockOnUpdate}
      />
    );

    // Open popover
    const button = screen.getByRole('button', {
      name: /set due date and time/i,
    });
    await user.click(button);

    // Click confirm without setting date
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    expect(
      screen.getByText(/please select a date and time/i)
    ).toBeInTheDocument();
  });

  it('should display Clear button when currentDueAt is set', async () => {
    const user = userEvent.setup();
    render(
      <TaskDueDatePicker
        taskId={mockTaskId}
        currentDueAt="2024-12-25T14:30:00Z"
        onUpdate={mockOnUpdate}
      />
    );

    // Open popover
    const button = screen.getByRole('button', {
      name: /set due date and time/i,
    });
    await user.click(button);

    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('should not display Clear button when currentDueAt is null', async () => {
    const user = userEvent.setup();
    render(
      <TaskDueDatePicker
        taskId={mockTaskId}
        currentDueAt={null}
        onUpdate={mockOnUpdate}
      />
    );

    // Open popover
    const button = screen.getByRole('button', {
      name: /set due date and time/i,
    });
    await user.click(button);

    expect(
      screen.queryByRole('button', { name: /clear/i })
    ).not.toBeInTheDocument();
  });

  it('should clear due_at when Clear button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TaskDueDatePicker
        taskId={mockTaskId}
        currentDueAt="2024-12-25T14:30:00Z"
        onUpdate={mockOnUpdate}
      />
    );

    // Open popover
    const button = screen.getByRole('button', {
      name: /set due date and time/i,
    });
    await user.click(button);

    // Click clear
    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    await waitFor(() => {
      expect(mockSupabaseUpdate).toHaveBeenCalledWith({ due_at: null });
    });
  });

  it('should close popover when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TaskDueDatePicker
        taskId={mockTaskId}
        currentDueAt={null}
        onUpdate={mockOnUpdate}
      />
    );

    // Open popover
    const button = screen.getByRole('button', {
      name: /set due date and time/i,
    });
    await user.click(button);

    // Click cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should close popover when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <div data-testid="outside">Outside element</div>
        <TaskDueDatePicker
          taskId={mockTaskId}
          currentDueAt={null}
          onUpdate={mockOnUpdate}
        />
      </div>
    );

    // Open popover
    const button = screen.getByRole('button', {
      name: /set due date and time/i,
    });
    await user.click(button);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Click outside
    const outside = screen.getByTestId('outside');
    await user.click(outside);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('should handle task update error gracefully', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Mock error response
    mockSupabaseUpdate.mockReturnValue({
      eq: jest.fn().mockResolvedValue({
        error: { message: 'Database error' },
      }),
    });

    render(
      <TaskDueDatePicker
        taskId={mockTaskId}
        currentDueAt={null}
        onUpdate={mockOnUpdate}
      />
    );

    // Open popover
    const button = screen.getByRole('button', {
      name: /set due date and time/i,
    });
    await user.click(button);

    // Set datetime
    const input = screen.getByLabelText(/due date & time/i);
    await user.clear(input);
    await user.type(input, '2024-12-25T14:30');

    // Click confirm
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(
        screen.getByText(/failed to update due date/i)
      ).toBeInTheDocument();
    });

    expect(mockOnUpdate).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should disable inputs while saving', async () => {
    const user = userEvent.setup();

    // Delay the response to keep isSaving true longer
    let resolveUpdate: any;
    const updatePromise = new Promise((resolve) => {
      resolveUpdate = resolve;
    });
    mockSupabaseUpdate.mockReturnValue({
      eq: jest.fn().mockReturnValue(updatePromise),
    });

    render(
      <TaskDueDatePicker
        taskId={mockTaskId}
        currentDueAt={null}
        onUpdate={mockOnUpdate}
      />
    );

    // Open popover
    const button = screen.getByRole('button', {
      name: /set due date and time/i,
    });
    await user.click(button);

    // Set datetime
    const input = screen.getByLabelText(/due date & time/i);
    await user.clear(input);
    await user.type(input, '2024-12-25T14:30');

    // Click confirm
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    // Check that inputs are disabled while saving
    await waitFor(() => {
      expect(input).toBeDisabled();
      expect(confirmButton).toBeDisabled();
    });

    // Resolve the promise
    resolveUpdate({ error: null });
  });
});
