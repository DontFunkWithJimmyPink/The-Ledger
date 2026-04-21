import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(() => ({
    refresh: jest.fn(),
  })),
}));

// Mock LabelManager component
jest.mock('@/components/labels/LabelManager', () => ({
  LabelManager: () => <div data-testid="label-manager">Label Manager</div>,
}));

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

describe('Sidebar', () => {
  beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue('/notebook');
  });

  it('should render the sidebar with logo', () => {
    render(<Sidebar />);
    expect(screen.getByText('The Ledger')).toBeInTheDocument();
  });

  it('should render navigation items', () => {
    render(<Sidebar />);
    expect(screen.getByRole('link', { name: /notebook/i })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /reminders/i })
    ).toBeInTheDocument();
  });

  it('should highlight active navigation item', () => {
    (usePathname as jest.Mock).mockReturnValue('/notebook');
    render(<Sidebar />);
    const notebookLink = screen.getByRole('link', { name: /notebook/i });
    expect(notebookLink).toHaveClass('bg-leather-700');
  });

  it('should highlight notebook when on a nested notebook page', () => {
    (usePathname as jest.Mock).mockReturnValue('/notebook/page-123');
    render(<Sidebar />);
    const notebookLink = screen.getByRole('link', { name: /notebook/i });
    expect(notebookLink).toHaveClass('bg-leather-700');
  });

  it('should highlight reminders when on reminders page', () => {
    (usePathname as jest.Mock).mockReturnValue('/reminders');
    render(<Sidebar />);
    const remindersLink = screen.getByRole('link', { name: /reminders/i });
    expect(remindersLink).toHaveClass('bg-leather-700');
  });

  it('should render label manager', () => {
    render(<Sidebar />);
    expect(screen.getByTestId('label-manager')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    const { container } = render(<Sidebar className="custom-class" />);
    const aside = container.querySelector('aside');
    expect(aside).toHaveClass('custom-class');
  });
});
