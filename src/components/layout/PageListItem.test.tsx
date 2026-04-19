import { render, screen } from '@testing-library/react';
import { PageListItem } from './PageListItem';
import type { Page } from '@/types';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function Link({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

describe('PageListItem', () => {
  const mockPage: Page = {
    id: 'page-123',
    notebook_id: 'notebook-456',
    title: 'Test Page Title',
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'This is some preview content.' }],
        },
      ],
    },
    sort_order: 'a0',
    created_at: new Date('2026-04-01T10:00:00Z').toISOString(),
    updated_at: new Date('2026-04-15T15:30:00Z').toISOString(),
  };

  it('should render page title', () => {
    render(<PageListItem page={mockPage} />);
    expect(screen.getByText('Test Page Title')).toBeInTheDocument();
  });

  it('should render "Untitled" for pages without title', () => {
    const untitledPage = { ...mockPage, title: '' };
    render(<PageListItem page={untitledPage} />);
    expect(screen.getByText('Untitled')).toBeInTheDocument();
  });

  it('should render relative update time', () => {
    render(<PageListItem page={mockPage} />);
    const updateText = screen.getByText(/Updated/);
    expect(updateText).toBeInTheDocument();
  });

  it('should render content preview', () => {
    render(<PageListItem page={mockPage} />);
    expect(
      screen.getByText('This is some preview content.')
    ).toBeInTheDocument();
  });

  it('should not render preview for empty content', () => {
    const emptyPage = { ...mockPage, content: {} };
    render(<PageListItem page={emptyPage} />);
    expect(
      screen.queryByText('This is some preview content.')
    ).not.toBeInTheDocument();
  });

  it('should truncate long preview text', () => {
    const longContentPage = {
      ...mockPage,
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'This is a very long piece of content that should be truncated because it exceeds the maximum preview length of 100 characters.',
              },
            ],
          },
        ],
      },
    };
    render(<PageListItem page={longContentPage} />);
    const preview = screen.getByText(/This is a very long piece/);
    expect(preview.textContent).toContain('...');
    expect(preview.textContent!.length).toBeLessThanOrEqual(104); // 100 + '...'
  });

  it('should link to the correct page URL', () => {
    render(<PageListItem page={mockPage} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/notebook/page-123');
  });

  it('should accept custom className', () => {
    const { container } = render(
      <PageListItem page={mockPage} className="custom-class" />
    );
    const link = container.querySelector('a');
    expect(link).toHaveClass('custom-class');
  });

  it('should render chevron icon', () => {
    const { container } = render(<PageListItem page={mockPage} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should format recent times as relative (e.g., "Just now")', () => {
    const recentPage = {
      ...mockPage,
      updated_at: new Date(Date.now() - 30 * 1000).toISOString(), // 30 seconds ago
    };
    render(<PageListItem page={recentPage} />);
    expect(screen.getByText(/Just now/)).toBeInTheDocument();
  });

  it('should format minutes ago correctly', () => {
    const recentPage = {
      ...mockPage,
      updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    };
    render(<PageListItem page={recentPage} />);
    expect(screen.getByText(/5 min ago/)).toBeInTheDocument();
  });

  it('should format hours ago correctly', () => {
    const recentPage = {
      ...mockPage,
      updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    };
    render(<PageListItem page={recentPage} />);
    expect(screen.getByText(/3 hours ago/)).toBeInTheDocument();
  });

  it('should format days ago correctly', () => {
    const recentPage = {
      ...mockPage,
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    };
    render(<PageListItem page={recentPage} />);
    expect(screen.getByText(/2 days ago/)).toBeInTheDocument();
  });
});
