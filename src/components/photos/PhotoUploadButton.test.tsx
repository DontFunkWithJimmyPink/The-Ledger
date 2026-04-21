import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhotoUploadButton } from './PhotoUploadButton';
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

describe('PhotoUploadButton', () => {
  const mockPageId = 'page-123';
  const mockUserId = 'user-456';
  const mockOnUploadSuccess = jest.fn();

  const mockSupabaseUpload = jest.fn();
  const mockSupabaseInsert = jest.fn();
  const mockSupabaseRemove = jest.fn();
  const mockSupabaseCreateSignedUrl = jest.fn();
  const mockSupabaseAuth = jest.fn();
  const mockSupabaseStorage = jest.fn();
  const mockSupabaseFrom = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup toast mock
    (toast as jest.Mock).error = jest.fn();
    (toast as jest.Mock).success = jest.fn();

    // Setup Supabase storage mock
    mockSupabaseUpload.mockResolvedValue({ error: null });
    mockSupabaseRemove.mockResolvedValue({ error: null });
    mockSupabaseCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://example.com/signed-url' },
      error: null,
    });

    mockSupabaseStorage.mockImplementation((bucket: string) => {
      if (bucket === 'notebook-photos') {
        return {
          upload: mockSupabaseUpload,
          remove: mockSupabaseRemove,
          createSignedUrl: mockSupabaseCreateSignedUrl,
        };
      }
      return {};
    });

    // Setup Supabase from mock
    const mockSupabaseSelect = jest.fn();
    mockSupabaseInsert.mockReturnValue({
      select: mockSupabaseSelect,
    });
    mockSupabaseSelect.mockReturnValue({
      single: jest.fn().mockResolvedValue({
        data: { id: 'photo-123' },
        error: null,
      }),
    });
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'photos') {
        return {
          insert: mockSupabaseInsert,
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

    // Setup complete Supabase client mock
    (createClient as jest.Mock).mockReturnValue({
      auth: mockSupabaseAuth(),
      storage: {
        from: mockSupabaseStorage,
      },
      from: mockSupabaseFrom,
    });
  });

  describe('Rendering', () => {
    it('should render upload button', () => {
      render(<PhotoUploadButton pageId={mockPageId} />);

      const button = screen.getByRole('button', { name: /upload photo/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('📷');
    });

    it('should render hidden file input with image/* accept', () => {
      render(<PhotoUploadButton pageId={mockPageId} />);

      const fileInput = screen.getByTestId('photo-upload-input');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('type', 'file');
      expect(fileInput).toHaveAttribute('accept', 'image/*');
      expect(fileInput).toHaveClass('hidden');
    });

    it('should open file chooser when button is clicked', async () => {
      const user = userEvent.setup();
      render(<PhotoUploadButton pageId={mockPageId} />);

      const fileInput = screen.getByTestId(
        'photo-upload-input'
      ) as HTMLInputElement;
      const clickSpy = jest.spyOn(fileInput, 'click');

      const button = screen.getByRole('button', { name: /upload photo/i });
      await user.click(button);

      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('File Size Validation (FR-019)', () => {
    it('should reject files larger than 10 MB', async () => {
      const user = userEvent.setup();
      render(<PhotoUploadButton pageId={mockPageId} />);

      const fileInput = screen.getByTestId(
        'photo-upload-input'
      ) as HTMLInputElement;

      // Create a file larger than 10 MB
      const oversizedFile = new File(['x'.repeat(10485761)], 'large.jpg', {
        type: 'image/jpeg',
      });

      await user.upload(fileInput, oversizedFile);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Photo must be under 10 MB');
      });

      // Should not attempt upload
      expect(mockSupabaseUpload).not.toHaveBeenCalled();
      expect(mockSupabaseInsert).not.toHaveBeenCalled();
    });

    it('should accept files exactly 10 MB', async () => {
      const user = userEvent.setup();
      render(
        <PhotoUploadButton
          pageId={mockPageId}
          onUploadSuccess={mockOnUploadSuccess}
        />
      );

      const fileInput = screen.getByTestId(
        'photo-upload-input'
      ) as HTMLInputElement;

      // Create a file exactly 10 MB (10485760 bytes)
      const validFile = new File(['x'.repeat(10485760)], 'valid.jpg', {
        type: 'image/jpeg',
      });

      await user.upload(fileInput, validFile);

      await waitFor(() => {
        expect(mockSupabaseUpload).toHaveBeenCalled();
      });

      expect(toast.error).not.toHaveBeenCalledWith('Photo must be under 10 MB');
    });

    it('should accept files smaller than 10 MB', async () => {
      const user = userEvent.setup();
      render(
        <PhotoUploadButton
          pageId={mockPageId}
          onUploadSuccess={mockOnUploadSuccess}
        />
      );

      const fileInput = screen.getByTestId(
        'photo-upload-input'
      ) as HTMLInputElement;

      const validFile = new File(['test content'], 'small.jpg', {
        type: 'image/jpeg',
      });

      await user.upload(fileInput, validFile);

      await waitFor(() => {
        expect(mockSupabaseUpload).toHaveBeenCalled();
      });

      expect(toast.error).not.toHaveBeenCalledWith('Photo must be under 10 MB');
    });
  });

  describe('Supabase Storage Upload', () => {
    it('should upload file to notebook-photos bucket with correct path format', async () => {
      const user = userEvent.setup();
      render(
        <PhotoUploadButton
          pageId={mockPageId}
          onUploadSuccess={mockOnUploadSuccess}
        />
      );

      const fileInput = screen.getByTestId(
        'photo-upload-input'
      ) as HTMLInputElement;
      const testFile = new File(['test'], 'test-image.jpg', {
        type: 'image/jpeg',
      });

      await user.upload(fileInput, testFile);

      await waitFor(() => {
        expect(mockSupabaseStorage).toHaveBeenCalledWith('notebook-photos');
      });

      await waitFor(() => {
        expect(mockSupabaseUpload).toHaveBeenCalledWith(
          expect.stringMatching(
            new RegExp(`^${mockUserId}/${mockPageId}/\\d+_test-image\\.jpg$`)
          ),
          testFile
        );
      });
    });

    it('should sanitize filename in storage path', async () => {
      const user = userEvent.setup();
      render(
        <PhotoUploadButton
          pageId={mockPageId}
          onUploadSuccess={mockOnUploadSuccess}
        />
      );

      const fileInput = screen.getByTestId(
        'photo-upload-input'
      ) as HTMLInputElement;
      const testFile = new File(['test'], 'my photo (1).jpg', {
        type: 'image/jpeg',
      });

      await user.upload(fileInput, testFile);

      await waitFor(() => {
        expect(mockSupabaseUpload).toHaveBeenCalledWith(
          expect.stringMatching(/_my_photo__1_\.jpg$/),
          testFile
        );
      });
    });

    it('should show error toast if storage upload fails', async () => {
      const user = userEvent.setup();
      mockSupabaseUpload.mockResolvedValue({
        error: { message: 'Upload error' },
      });

      render(<PhotoUploadButton pageId={mockPageId} />);

      const fileInput = screen.getByTestId(
        'photo-upload-input'
      ) as HTMLInputElement;
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await user.upload(fileInput, testFile);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Upload failed');
      });

      expect(mockSupabaseInsert).not.toHaveBeenCalled();
    });
  });

  describe('Database Record Insertion', () => {
    it('should insert photo record with correct data', async () => {
      const user = userEvent.setup();
      render(
        <PhotoUploadButton
          pageId={mockPageId}
          onUploadSuccess={mockOnUploadSuccess}
        />
      );

      const fileInput = screen.getByTestId(
        'photo-upload-input'
      ) as HTMLInputElement;
      const testFile = new File(['test content'], 'test.jpg', {
        type: 'image/jpeg',
      });

      // Mock the insert to return a photo ID
      mockSupabaseInsert.mockResolvedValue({
        data: { id: 'photo-123' },
        error: null,
      });

      await user.upload(fileInput, testFile);

      await waitFor(() => {
        expect(mockSupabaseInsert).toHaveBeenCalledWith({
          page_id: mockPageId,
          user_id: mockUserId,
          storage_path: expect.stringMatching(
            new RegExp(`^${mockUserId}/${mockPageId}/\\d+_test\\.jpg$`)
          ),
          filename: 'test.jpg',
          mime_type: 'image/jpeg',
          size_bytes: testFile.size,
        });
      });
    });

    it('should clean up storage file if database insert fails', async () => {
      const user = userEvent.setup();
      const mockSingleFail = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Insert error' },
      });
      const mockSelectFail = jest.fn().mockReturnValue({
        single: mockSingleFail,
      });
      mockSupabaseInsert.mockReturnValue({
        select: mockSelectFail,
      });

      render(<PhotoUploadButton pageId={mockPageId} />);

      const fileInput = screen.getByTestId(
        'photo-upload-input'
      ) as HTMLInputElement;
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await user.upload(fileInput, testFile);

      await waitFor(() => {
        expect(mockSupabaseRemove).toHaveBeenCalledWith([
          expect.stringMatching(
            new RegExp(`^${mockUserId}/${mockPageId}/\\d+_test\\.jpg$`)
          ),
        ]);
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Upload failed');
      });
    });
  });

  describe('Signed URL Generation', () => {
    it('should create signed URL with 1 hour expiry', async () => {
      const user = userEvent.setup();
      render(
        <PhotoUploadButton
          pageId={mockPageId}
          onUploadSuccess={mockOnUploadSuccess}
        />
      );

      const fileInput = screen.getByTestId(
        'photo-upload-input'
      ) as HTMLInputElement;
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await user.upload(fileInput, testFile);

      await waitFor(() => {
        expect(mockSupabaseCreateSignedUrl).toHaveBeenCalledWith(
          expect.stringMatching(
            new RegExp(`^${mockUserId}/${mockPageId}/\\d+_test\\.jpg$`)
          ),
          3600
        );
      });
    });

    it('should call onUploadSuccess with photo metadata', async () => {
      const user = userEvent.setup();
      render(
        <PhotoUploadButton
          pageId={mockPageId}
          onUploadSuccess={mockOnUploadSuccess}
        />
      );

      const fileInput = screen.getByTestId(
        'photo-upload-input'
      ) as HTMLInputElement;
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await user.upload(fileInput, testFile);

      await waitFor(() => {
        expect(mockOnUploadSuccess).toHaveBeenCalledWith({
          id: 'photo-123',
          storagePath: expect.stringMatching(
            new RegExp(`^${mockUserId}/${mockPageId}/\\d+_test\\.jpg$`)
          ),
          signedUrl: 'https://example.com/signed-url',
          filename: 'test.jpg',
        });
      });
    });

    it('should show error if signed URL creation fails', async () => {
      const user = userEvent.setup();
      mockSupabaseCreateSignedUrl.mockResolvedValue({
        data: null,
        error: { message: 'Signed URL error' },
      });

      render(<PhotoUploadButton pageId={mockPageId} />);

      const fileInput = screen.getByTestId(
        'photo-upload-input'
      ) as HTMLInputElement;
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await user.upload(fileInput, testFile);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Upload failed');
      });
    });
  });

  describe('Success State', () => {
    it('should show success toast on successful upload', async () => {
      const user = userEvent.setup();
      render(
        <PhotoUploadButton
          pageId={mockPageId}
          onUploadSuccess={mockOnUploadSuccess}
        />
      );

      const fileInput = screen.getByTestId(
        'photo-upload-input'
      ) as HTMLInputElement;
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await user.upload(fileInput, testFile);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Photo uploaded');
      });
    });
  });

  describe('User Authentication', () => {
    it('should show error if user is not authenticated', async () => {
      const user = userEvent.setup();
      const mockAuth = {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      };

      (createClient as jest.Mock).mockReturnValue({
        auth: mockAuth,
        storage: { from: mockSupabaseStorage },
        from: mockSupabaseFrom,
      });

      render(<PhotoUploadButton pageId={mockPageId} />);

      const fileInput = screen.getByTestId(
        'photo-upload-input'
      ) as HTMLInputElement;
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await user.upload(fileInput, testFile);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to upload photo');
      });

      expect(mockSupabaseUpload).not.toHaveBeenCalled();
    });

    it('should show error if auth.getUser fails', async () => {
      const user = userEvent.setup();
      const mockAuth = {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Auth error' },
        }),
      };

      (createClient as jest.Mock).mockReturnValue({
        auth: mockAuth,
        storage: { from: mockSupabaseStorage },
        from: mockSupabaseFrom,
      });

      render(<PhotoUploadButton pageId={mockPageId} />);

      const fileInput = screen.getByTestId(
        'photo-upload-input'
      ) as HTMLInputElement;
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await user.upload(fileInput, testFile);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to upload photo');
      });
    });
  });

  describe('Loading State', () => {
    it('should disable button and show loading state during upload', async () => {
      const user = userEvent.setup();
      // Make upload take some time
      mockSupabaseUpload.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ error: null }), 100)
          )
      );

      render(<PhotoUploadButton pageId={mockPageId} />);

      const fileInput = screen.getByTestId(
        'photo-upload-input'
      ) as HTMLInputElement;
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await user.upload(fileInput, testFile);

      // Check loading state
      const button = screen.getByRole('button', { name: /uploading photo/i });
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent('...');

      // Wait for upload to complete
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      });
    });

    it('should reset file input value after file selection', async () => {
      const user = userEvent.setup();
      render(<PhotoUploadButton pageId={mockPageId} />);

      const fileInput = screen.getByTestId(
        'photo-upload-input'
      ) as HTMLInputElement;
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await user.upload(fileInput, testFile);

      // File input value should be reset
      expect(fileInput.value).toBe('');
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      const user = userEvent.setup();
      mockSupabaseUpload.mockRejectedValue(new Error('Unexpected error'));

      render(<PhotoUploadButton pageId={mockPageId} />);

      const fileInput = screen.getByTestId(
        'photo-upload-input'
      ) as HTMLInputElement;
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await user.upload(fileInput, testFile);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Upload failed');
      });
    });
  });
});
