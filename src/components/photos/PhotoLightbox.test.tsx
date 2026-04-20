import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhotoLightbox } from './PhotoLightbox';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

// Mock Supabase client
jest.mock('@/lib/supabase/client');

// Mock react-hot-toast
jest.mock('react-hot-toast', () => {
  const mockToast = jest.fn();
  return {
    __esModule: true,
    default: mockToast,
  };
});

describe('PhotoLightbox', () => {
  const mockOnClose = jest.fn();
  const mockOnDelete = jest.fn();
  const mockSrc = 'https://example.com/photo.jpg';
  const mockAlt = 'Test photo description';
  const mockPhotoId = 'photo-123';
  const mockStoragePath = 'user-id/page-id/123_photo.jpg';

  const mockSupabaseStorageRemove = jest.fn();
  const mockSupabaseDelete = jest.fn();
  const mockSupabaseFrom = jest.fn();
  const mockSupabaseStorage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup toast mock
    (toast as jest.Mock).error = jest.fn();
    (toast as jest.Mock).success = jest.fn();

    // Setup Supabase storage mock
    mockSupabaseStorageRemove.mockResolvedValue({ error: null });
    mockSupabaseStorage.mockImplementation((bucket: string) => {
      if (bucket === 'notebook-photos') {
        return {
          remove: mockSupabaseStorageRemove,
        };
      }
      return {};
    });

    // Setup Supabase from mock
    const mockEq = jest.fn().mockResolvedValue({ error: null });
    mockSupabaseDelete.mockReturnValue({ eq: mockEq });
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'photos') {
        return {
          delete: mockSupabaseDelete,
        };
      }
      return {};
    });

    // Setup complete Supabase client mock
    (createClient as jest.Mock).mockReturnValue({
      storage: {
        from: mockSupabaseStorage,
      },
      from: mockSupabaseFrom,
    });
  });

  it('should not render when isOpen is false', () => {
    render(
      <PhotoLightbox
        isOpen={false}
        onClose={mockOnClose}
        src={mockSrc}
        alt={mockAlt}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <PhotoLightbox
        isOpen={true}
        onClose={mockOnClose}
        src={mockSrc}
        alt={mockAlt}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should render image with correct src and alt', () => {
    render(
      <PhotoLightbox
        isOpen={true}
        onClose={mockOnClose}
        src={mockSrc}
        alt={mockAlt}
      />
    );

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', mockSrc);
    expect(image).toHaveAttribute('alt', mockAlt);
  });

  it('should render close button', () => {
    render(
      <PhotoLightbox
        isOpen={true}
        onClose={mockOnClose}
        src={mockSrc}
        alt={mockAlt}
      />
    );

    expect(screen.getByLabelText('Close lightbox')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PhotoLightbox
        isOpen={true}
        onClose={mockOnClose}
        src={mockSrc}
        alt={mockAlt}
      />
    );

    const closeButton = screen.getByLabelText('Close lightbox');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Escape key is pressed', async () => {
    const user = userEvent.setup();
    render(
      <PhotoLightbox
        isOpen={true}
        onClose={mockOnClose}
        src={mockSrc}
        alt={mockAlt}
      />
    );

    await user.keyboard('{Escape}');

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PhotoLightbox
        isOpen={true}
        onClose={mockOnClose}
        src={mockSrc}
        alt={mockAlt}
      />
    );

    const backdrop = screen.getByRole('dialog').parentElement;
    if (backdrop) {
      await user.click(backdrop);
    }

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when image is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PhotoLightbox
        isOpen={true}
        onClose={mockOnClose}
        src={mockSrc}
        alt={mockAlt}
      />
    );

    const image = screen.getByRole('img');
    await user.click(image);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should prevent body scroll when open', () => {
    const { rerender } = render(
      <PhotoLightbox
        isOpen={true}
        onClose={mockOnClose}
        src={mockSrc}
        alt={mockAlt}
      />
    );

    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <PhotoLightbox
        isOpen={false}
        onClose={mockOnClose}
        src={mockSrc}
        alt={mockAlt}
      />
    );

    expect(document.body.style.overflow).toBe('unset');
  });

  it('should have proper ARIA attributes', () => {
    render(
      <PhotoLightbox
        isOpen={true}
        onClose={mockOnClose}
        src={mockSrc}
        alt={mockAlt}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Photo lightbox');
  });

  it('should clean up event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

    const { unmount } = render(
      <PhotoLightbox
        isOpen={true}
        onClose={mockOnClose}
        src={mockSrc}
        alt={mockAlt}
      />
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    );
    expect(document.body.style.overflow).toBe('unset');

    removeEventListenerSpy.mockRestore();
  });

  it('should not call onClose when Escape is pressed and lightbox is closed', async () => {
    const user = userEvent.setup();
    render(
      <PhotoLightbox
        isOpen={false}
        onClose={mockOnClose}
        src={mockSrc}
        alt={mockAlt}
      />
    );

    await user.keyboard('{Escape}');

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  describe('Photo Deletion', () => {
    it('should not show delete button when photoId and storagePath are not provided', () => {
      render(
        <PhotoLightbox
          isOpen={true}
          onClose={mockOnClose}
          src={mockSrc}
          alt={mockAlt}
        />
      );

      expect(screen.queryByLabelText('Delete photo')).not.toBeInTheDocument();
    });

    it('should show delete button when photoId and storagePath are provided', () => {
      render(
        <PhotoLightbox
          isOpen={true}
          onClose={mockOnClose}
          src={mockSrc}
          alt={mockAlt}
          photoId={mockPhotoId}
          storagePath={mockStoragePath}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByLabelText('Delete photo')).toBeInTheDocument();
    });

    it('should delete photo from storage and database when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <PhotoLightbox
          isOpen={true}
          onClose={mockOnClose}
          src={mockSrc}
          alt={mockAlt}
          photoId={mockPhotoId}
          storagePath={mockStoragePath}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByLabelText('Delete photo');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockSupabaseStorage).toHaveBeenCalledWith('notebook-photos');
        expect(mockSupabaseStorageRemove).toHaveBeenCalledWith([mockStoragePath]);
      });

      await waitFor(() => {
        expect(mockSupabaseFrom).toHaveBeenCalledWith('photos');
        expect(mockSupabaseDelete).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Photo deleted');
        expect(mockOnClose).toHaveBeenCalled();
        expect(mockOnDelete).toHaveBeenCalled();
      });
    });

    it('should show error toast if storage deletion fails', async () => {
      const user = userEvent.setup();
      mockSupabaseStorageRemove.mockResolvedValue({
        error: { message: 'Storage error' },
      });

      render(
        <PhotoLightbox
          isOpen={true}
          onClose={mockOnClose}
          src={mockSrc}
          alt={mockAlt}
          photoId={mockPhotoId}
          storagePath={mockStoragePath}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByLabelText('Delete photo');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to delete photo');
      });

      expect(mockSupabaseDelete).not.toHaveBeenCalled();
      expect(mockOnDelete).not.toHaveBeenCalled();
    });

    it('should show error toast if database deletion fails', async () => {
      const user = userEvent.setup();
      const mockEq = jest.fn().mockResolvedValue({
        error: { message: 'Database error' },
      });
      mockSupabaseDelete.mockReturnValue({ eq: mockEq });

      render(
        <PhotoLightbox
          isOpen={true}
          onClose={mockOnClose}
          src={mockSrc}
          alt={mockAlt}
          photoId={mockPhotoId}
          storagePath={mockStoragePath}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByLabelText('Delete photo');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to delete photo');
      });

      expect(mockOnDelete).not.toHaveBeenCalled();
    });

    it('should disable buttons while deleting', async () => {
      const user = userEvent.setup();
      // Make storage delete take some time
      mockSupabaseStorageRemove.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
      );

      render(
        <PhotoLightbox
          isOpen={true}
          onClose={mockOnClose}
          src={mockSrc}
          alt={mockAlt}
          photoId={mockPhotoId}
          storagePath={mockStoragePath}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByLabelText('Delete photo');
      await user.click(deleteButton);

      // Check buttons are disabled
      expect(deleteButton).toBeDisabled();
      expect(screen.getByLabelText('Close lightbox')).toBeDisabled();

      // Wait for deletion to complete
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      });
    });
  });
});
