import { render } from '@testing-library/react';
import { ReminderPoller } from './ReminderPoller';
import { useReminders } from '@/lib/hooks/use-reminders';

// Mock the useReminders hook
jest.mock('@/lib/hooks/use-reminders', () => ({
  useReminders: jest.fn(),
}));

describe('ReminderPoller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should mount the useReminders hook', () => {
    render(<ReminderPoller />);

    expect(useReminders).toHaveBeenCalledTimes(1);
  });

  it('should not render any visible UI', () => {
    const { container } = render(<ReminderPoller />);

    // Component should render null
    expect(container.firstChild).toBeNull();
  });

  it('should call useReminders on each render', () => {
    const { rerender } = render(<ReminderPoller />);

    expect(useReminders).toHaveBeenCalledTimes(1);

    rerender(<ReminderPoller />);

    expect(useReminders).toHaveBeenCalledTimes(2);
  });

  it('should work when useReminders is called', () => {
    // Ensure no errors are thrown when the hook is invoked
    expect(() => {
      render(<ReminderPoller />);
    }).not.toThrow();
  });
});
