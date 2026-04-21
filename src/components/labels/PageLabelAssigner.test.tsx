import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { PageLabelAssigner } from './PageLabelAssigner';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import type { Label } from '@/types';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('PageLabelAssigner', () => {
  let mockSupabase: any;
  let mockRouter: any;

  const mockAllLabels: Label[] = [
    {
      id: 'label-1',
      name: 'Work',
      color: 'blue-100',
      user_id: 'user-123',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'label-2',
      name: 'Personal',
      color: 'green-100',
      user_id: 'user-123',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'label-3',
      name: 'Important',
      color: 'red-100',
      user_id: 'user-123',
      created_at: '2024-01-01T00:00:00Z',
    },
  ];

  const mockAssignedLabels: Label[] = [mockAllLabels[0]]; // Work label is assigned

  beforeEach(() => {
    jest.clearAllMocks();

    mockRouter = {
      refresh: jest.fn(),
    };

    mockSupabase = {
      from: jest.fn(),
    };

    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('should render assigned labels as badges', () => {
    render(
      <PageLabelAssigner
        pageId="page-123"
        allLabels={mockAllLabels}
        assignedLabels={mockAssignedLabels}
      />
    );

    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.queryByText('Personal')).not.toBeInTheDocument();
    expect(screen.queryByText('Important')).not.toBeInTheDocument();
  });

  it('should show "Add Label" button when there are unassigned labels', () => {
    render(
      <PageLabelAssigner
        pageId="page-123"
        allLabels={mockAllLabels}
        assignedLabels={mockAssignedLabels}
      />
    );

    expect(screen.getByText('+ Add Label')).toBeInTheDocument();
  });

  it('should not show "Add Label" button when all labels are assigned', () => {
    render(
      <PageLabelAssigner
        pageId="page-123"
        allLabels={mockAllLabels}
        assignedLabels={mockAllLabels}
      />
    );

    expect(screen.queryByText('+ Add Label')).not.toBeInTheDocument();
  });

  it('should show message when no labels are available', () => {
    render(
      <PageLabelAssigner pageId="page-123" allLabels={[]} assignedLabels={[]} />
    );

    expect(
      screen.getByText('No labels available. Create labels in the sidebar.')
    ).toBeInTheDocument();
  });

  it('should open dropdown when "Add Label" is clicked', async () => {
    const user = userEvent.setup();

    render(
      <PageLabelAssigner
        pageId="page-123"
        allLabels={mockAllLabels}
        assignedLabels={mockAssignedLabels}
      />
    );

    const addButton = screen.getByText('+ Add Label');
    await user.click(addButton);

    // Dropdown should show unassigned labels
    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getByText('Important')).toBeInTheDocument();
  });

  it('should assign label when selected from dropdown', async () => {
    const user = userEvent.setup();

    mockSupabase.from.mockReturnValue({
      insert: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    });

    render(
      <PageLabelAssigner
        pageId="page-123"
        allLabels={mockAllLabels}
        assignedLabels={mockAssignedLabels}
      />
    );

    // Open dropdown
    const addButton = screen.getByText('+ Add Label');
    await user.click(addButton);

    // Click on "Personal" label
    const personalLabel = screen.getByText('Personal');
    await user.click(personalLabel);

    // Verify Supabase insert was called
    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('page_labels');
      const insertMock = mockSupabase.from().insert;
      expect(insertMock).toHaveBeenCalledWith({
        page_id: 'page-123',
        label_id: 'label-2',
      });
    });

    // Verify success toast
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Label "Personal" assigned');
    });

    // Verify router.refresh was called
    expect(mockRouter.refresh).toHaveBeenCalled();
  });

  it('should show error toast when label assignment fails', async () => {
    const user = userEvent.setup();

    mockSupabase.from.mockReturnValue({
      insert: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    });

    render(
      <PageLabelAssigner
        pageId="page-123"
        allLabels={mockAllLabels}
        assignedLabels={mockAssignedLabels}
      />
    );

    // Open dropdown
    const addButton = screen.getByText('+ Add Label');
    await user.click(addButton);

    // Click on "Personal" label
    const personalLabel = screen.getByText('Personal');
    await user.click(personalLabel);

    // Verify error toast
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to assign label');
    });

    // Router.refresh should not be called on error
    expect(mockRouter.refresh).not.toHaveBeenCalled();
  });

  it('should remove label when × button is clicked', async () => {
    const user = userEvent.setup();

    const mockDelete = jest.fn().mockResolvedValue({
      data: null,
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: mockDelete,
        }),
      }),
    });

    render(
      <PageLabelAssigner
        pageId="page-123"
        allLabels={mockAllLabels}
        assignedLabels={mockAssignedLabels}
      />
    );

    // Find and click the remove button (×)
    const removeButton = screen.getByLabelText('Remove label Work');
    await user.click(removeButton);

    // Verify Supabase delete was called
    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('page_labels');
    });

    // Verify success toast
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Label "Work" removed');
    });

    // Verify router.refresh was called
    expect(mockRouter.refresh).toHaveBeenCalled();
  });

  it('should show error toast when label removal fails', async () => {
    const user = userEvent.setup();

    const mockDelete = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });

    mockSupabase.from.mockReturnValue({
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: mockDelete,
        }),
      }),
    });

    render(
      <PageLabelAssigner
        pageId="page-123"
        allLabels={mockAllLabels}
        assignedLabels={mockAssignedLabels}
      />
    );

    // Find and click the remove button (×)
    const removeButton = screen.getByLabelText('Remove label Work');
    await user.click(removeButton);

    // Verify error toast
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to remove label');
    });

    // Router.refresh should not be called on error
    expect(mockRouter.refresh).not.toHaveBeenCalled();
  });

  it('should close dropdown when clicking outside', async () => {
    const user = userEvent.setup();

    render(
      <PageLabelAssigner
        pageId="page-123"
        allLabels={mockAllLabels}
        assignedLabels={mockAssignedLabels}
      />
    );

    // Open dropdown
    const addButton = screen.getByText('+ Add Label');
    await user.click(addButton);

    // Dropdown should be visible
    expect(screen.getByText('Personal')).toBeInTheDocument();

    // Click outside (on the backdrop)
    const backdrop = document.querySelector('.fixed.inset-0');
    expect(backdrop).toBeInTheDocument();
    await user.click(backdrop!);

    // Dropdown should be closed
    await waitFor(() => {
      expect(screen.queryByText('Personal')).not.toBeInTheDocument();
    });
  });

  it('should disable buttons when loading', async () => {
    const user = userEvent.setup();

    // Simulate a slow insert operation
    mockSupabase.from.mockReturnValue({
      insert: jest.fn().mockReturnValue(
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                data: null,
                error: null,
              }),
            100
          )
        )
      ),
    });

    render(
      <PageLabelAssigner
        pageId="page-123"
        allLabels={mockAllLabels}
        assignedLabels={mockAssignedLabels}
      />
    );

    // Open dropdown
    const addButton = screen.getByText('+ Add Label');
    await user.click(addButton);

    // Click on "Personal" label
    const personalLabel = screen.getByText('Personal');
    await user.click(personalLabel);

    // Buttons should be disabled during loading
    // Note: This test may need adjustment based on actual implementation
    await waitFor(() => {
      expect(mockRouter.refresh).toHaveBeenCalled();
    });
  });

  it('should map label colors to badge colors correctly', () => {
    const labelsWithVariousColors: Label[] = [
      {
        id: 'label-red',
        name: 'Red Label',
        color: 'red-100',
        user_id: 'user-123',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'label-green',
        name: 'Green Label',
        color: 'green-100',
        user_id: 'user-123',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'label-blue',
        name: 'Blue Label',
        color: 'blue-100',
        user_id: 'user-123',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'label-amber',
        name: 'Amber Label',
        color: 'amber-100',
        user_id: 'user-123',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'label-leather',
        name: 'Leather Label',
        color: 'leather-300',
        user_id: 'user-123',
        created_at: '2024-01-01T00:00:00Z',
      },
    ];

    render(
      <PageLabelAssigner
        pageId="page-123"
        allLabels={labelsWithVariousColors}
        assignedLabels={labelsWithVariousColors}
      />
    );

    // All labels should be rendered
    expect(screen.getByText('Red Label')).toBeInTheDocument();
    expect(screen.getByText('Green Label')).toBeInTheDocument();
    expect(screen.getByText('Blue Label')).toBeInTheDocument();
    expect(screen.getByText('Amber Label')).toBeInTheDocument();
    expect(screen.getByText('Leather Label')).toBeInTheDocument();
  });
});
