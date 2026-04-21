import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { SidebarPageListItem } from './SidebarPageListItem';
import type { Page } from '@/types';

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

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

describe('SidebarPageListItem', () => {
  const mockPage: Page = {
    id: 'page-1',
    notebook_id: 'notebook-1',
    title: 'Test Page',
    content: {},
    sort_order: 'a0',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockSetNodeRef = jest.fn();
  const mockListeners = { onPointerDown: jest.fn() };
  const mockAttributes = { 'data-sortable': 'true' };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default useSortable mock
    mockUseSortable.mockReturnValue({
      attributes: mockAttributes,
      listeners: mockListeners,
      setNodeRef: mockSetNodeRef,
      transform: null,
      transition: null,
      isDragging: false,
    });

    (usePathname as jest.Mock).mockReturnValue('/notebook');
  });

  it('should render page title', () => {
    render(<SidebarPageListItem page={mockPage} />);
    expect(screen.getByText('Test Page')).toBeInTheDocument();
  });

  it('should render "Untitled" for page without title', () => {
    const pageWithoutTitle = { ...mockPage, title: '' };
    render(<SidebarPageListItem page={pageWithoutTitle} />);
    expect(screen.getByText('Untitled')).toBeInTheDocument();
  });

  it('should render drag handle with aria-label', () => {
    render(<SidebarPageListItem page={mockPage} />);
    const dragHandle = screen.getByLabelText('Drag to reorder page');
    expect(dragHandle).toBeInTheDocument();
    expect(dragHandle).toHaveAttribute('type', 'button');
  });

  it('should render link to page', () => {
    render(<SidebarPageListItem page={mockPage} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/notebook/page-1');
  });

  it('should highlight active page', () => {
    (usePathname as jest.Mock).mockReturnValue('/notebook/page-1');
    render(<SidebarPageListItem page={mockPage} />);
    const link = screen.getByRole('link');
    expect(link).toHaveClass('bg-leather-700');
    expect(link).toHaveClass('text-cream-50');
  });

  it('should not highlight inactive page', () => {
    (usePathname as jest.Mock).mockReturnValue('/notebook/other-page');
    render(<SidebarPageListItem page={mockPage} />);
    const link = screen.getByRole('link');
    expect(link).not.toHaveClass('bg-leather-700');
    expect(link).toHaveClass('text-cream-100');
  });

  it('should apply dragging styles when dragging', () => {
    mockUseSortable.mockReturnValue({
      attributes: mockAttributes,
      listeners: mockListeners,
      setNodeRef: mockSetNodeRef,
      transform: { x: 10, y: 20, scaleX: 1, scaleY: 1 },
      transition: 'transform 200ms',
      isDragging: true,
    });

    const { container } = render(<SidebarPageListItem page={mockPage} />);
    const rootDiv = container.firstChild as HTMLElement;

    expect(rootDiv).toHaveStyle({
      opacity: 0.5,
      transform: 'translate3d(10px, 20px, 0)',
      transition: 'transform 200ms',
    });
  });

  it('should apply shadow when dragging', () => {
    mockUseSortable.mockReturnValue({
      attributes: mockAttributes,
      listeners: mockListeners,
      setNodeRef: mockSetNodeRef,
      transform: { x: 10, y: 20, scaleX: 1, scaleY: 1 },
      transition: null,
      isDragging: true,
    });

    const { container } = render(<SidebarPageListItem page={mockPage} />);
    const rootDiv = container.firstChild as HTMLElement;

    expect(rootDiv).toHaveClass('shadow-lg');
  });

  it('should attach sortable attributes to drag handle', () => {
    render(<SidebarPageListItem page={mockPage} />);
    const dragHandle = screen.getByLabelText('Drag to reorder page');

    expect(dragHandle).toHaveAttribute('data-sortable', 'true');
  });

  it('should call setNodeRef on mount', () => {
    render(<SidebarPageListItem page={mockPage} />);
    expect(mockSetNodeRef).toHaveBeenCalled();
  });
});
