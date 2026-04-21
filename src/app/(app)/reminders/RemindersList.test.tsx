import { render, screen } from '@testing-library/react';
import { RemindersList } from './RemindersList';

// Mock ReminderItem component
jest.mock('./ReminderItem', () => ({
  ReminderItem: ({
    reminder,
  }: {
    reminder: { id: string; task_text: string | null };
  }) => <div data-testid={`reminder-${reminder.id}`}>{reminder.task_text}</div>,
}));

describe('RemindersList', () => {
  const mockOverdueReminders = [
    {
      id: 'reminder-1',
      task_id: 'task-1',
      page_id: 'page-1',
      fire_at: '2024-01-10T10:00:00Z',
      status: 'pending',
      task_text: 'Overdue task 1',
      page_title: 'Page 1',
    },
    {
      id: 'reminder-2',
      task_id: 'task-2',
      page_id: 'page-2',
      fire_at: '2024-01-11T10:00:00Z',
      status: 'pending',
      task_text: 'Overdue task 2',
      page_title: 'Page 2',
    },
  ];

  const mockUpcomingReminders = [
    {
      id: 'reminder-3',
      task_id: 'task-3',
      page_id: 'page-3',
      fire_at: '2024-12-20T10:00:00Z',
      status: 'pending',
      task_text: 'Upcoming task 1',
      page_title: 'Page 3',
    },
  ];

  it('should render overdue section when overdue reminders exist', () => {
    render(<RemindersList overdue={mockOverdueReminders} upcoming={[]} />);
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('should render upcoming section when upcoming reminders exist', () => {
    render(<RemindersList overdue={[]} upcoming={mockUpcomingReminders} />);
    expect(screen.getByText('Upcoming')).toBeInTheDocument();
  });

  it('should render both sections when both exist', () => {
    render(
      <RemindersList
        overdue={mockOverdueReminders}
        upcoming={mockUpcomingReminders}
      />
    );
    expect(screen.getByText('Overdue')).toBeInTheDocument();
    expect(screen.getByText('Upcoming')).toBeInTheDocument();
  });

  it('should not render overdue section when empty', () => {
    render(<RemindersList overdue={[]} upcoming={mockUpcomingReminders} />);
    expect(screen.queryByText('Overdue')).not.toBeInTheDocument();
  });

  it('should not render upcoming section when empty', () => {
    render(<RemindersList overdue={mockOverdueReminders} upcoming={[]} />);
    expect(screen.queryByText('Upcoming')).not.toBeInTheDocument();
  });

  it('should render correct number of overdue reminders', () => {
    render(<RemindersList overdue={mockOverdueReminders} upcoming={[]} />);
    expect(screen.getByTestId('reminder-reminder-1')).toBeInTheDocument();
    expect(screen.getByTestId('reminder-reminder-2')).toBeInTheDocument();
  });

  it('should render correct number of upcoming reminders', () => {
    render(<RemindersList overdue={[]} upcoming={mockUpcomingReminders} />);
    expect(screen.getByTestId('reminder-reminder-3')).toBeInTheDocument();
  });

  it('should render all reminders when both arrays populated', () => {
    render(
      <RemindersList
        overdue={mockOverdueReminders}
        upcoming={mockUpcomingReminders}
      />
    );
    expect(screen.getByTestId('reminder-reminder-1')).toBeInTheDocument();
    expect(screen.getByTestId('reminder-reminder-2')).toBeInTheDocument();
    expect(screen.getByTestId('reminder-reminder-3')).toBeInTheDocument();
  });

  it('should render nothing when both arrays are empty', () => {
    const { container } = render(<RemindersList overdue={[]} upcoming={[]} />);
    expect(container.firstChild?.childNodes.length).toBe(0);
  });

  it('should maintain correct order within sections', () => {
    const { container } = render(
      <RemindersList overdue={mockOverdueReminders} upcoming={[]} />
    );

    const overdueSection = container.querySelector('section');
    const items = overdueSection?.querySelectorAll(
      '[data-testid^="reminder-"]'
    );

    expect(items?.[0]).toHaveAttribute('data-testid', 'reminder-reminder-1');
    expect(items?.[1]).toHaveAttribute('data-testid', 'reminder-reminder-2');
  });

  it('should apply correct spacing classes', () => {
    const { container } = render(
      <RemindersList
        overdue={mockOverdueReminders}
        upcoming={mockUpcomingReminders}
      />
    );

    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('space-y-8');
  });
});
