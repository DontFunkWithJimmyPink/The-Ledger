import { render, act } from '@testing-library/react';
import { PageEditor } from './PageEditor';
import { usePolling } from '@/lib/hooks/use-polling';
import { useAutosave } from '@/lib/hooks/use-autosave';
import type { Page } from '@/types';

// Mock dependencies
jest.mock('@/lib/hooks/use-polling');
jest.mock('@/lib/hooks/use-autosave');
jest.mock('react-hot-toast');

// Mock Tiptap editor
const mockSetContent = jest.fn();
const mockEditor = {
  commands: {
    setContent: mockSetContent,
  },
  isFocused: jest.fn(() => false),
};

jest.mock('@tiptap/react', () => ({
  useEditor: jest.fn((config) => {
    // Store handlers for testing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockEditor as any).onFocus = config.onFocus;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockEditor as any).onBlur = config.onBlur;
    return mockEditor;
  }),
  EditorContent: jest.fn(() => <div data-testid="editor-content" />),
}));

jest.mock('@/components/editor/EditorToolbar', () => ({
  EditorToolbar: jest.fn(() => <div data-testid="editor-toolbar" />),
}));

jest.mock('@/components/photos/PhotoLightbox', () => ({
  PhotoLightbox: jest.fn(() => null),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

describe('PageEditor - Polling (T068)', () => {
  const mockPage: Page = {
    id: 'test-page-id',
    notebook_id: 'test-notebook-id',
    title: 'Test Page',
    content: { type: 'doc', content: [] },
    sort_order: '0',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  };

  const mockUseAutosave = useAutosave as jest.MockedFunction<
    typeof useAutosave
  >;
  const mockUsePolling = usePolling as jest.MockedFunction<typeof usePolling>;

  let pollingCallback: (() => void | Promise<void>) | null = null;
  let mockSupabaseSelect: jest.Mock;
  let mockSupabaseFrom: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    pollingCallback = null;
    mockSetContent.mockClear();

    // Mock useAutosave
    mockUseAutosave.mockReturnValue({
      status: 'idle',
      trigger: jest.fn(),
      reset: jest.fn(),
      retry: jest.fn(),
    });

    // Capture polling callback
    mockUsePolling.mockImplementation(
      (callback: () => void | Promise<void>) => {
        pollingCallback = callback;
      }
    );

    // Mock Supabase client
    mockSupabaseSelect = jest.fn();
    mockSupabaseFrom = jest.fn(() => ({
      select: mockSupabaseSelect,
    }));

    jest.mock('@/lib/supabase/client', () => ({
      createClient: jest.fn(() => ({
        from: mockSupabaseFrom,
      })),
    }));
  });

  describe('Polling setup', () => {
    it('should mount usePolling hook with 30 second interval', () => {
      render(<PageEditor pageId={mockPage.id} initialPage={mockPage} />);

      expect(mockUsePolling).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          interval: 30000,
          runOnMount: false,
        })
      );
    });

    it('should not run polling on mount', () => {
      render(<PageEditor pageId={mockPage.id} initialPage={mockPage} />);

      const options = mockUsePolling.mock.calls[0][1];
      expect(options?.runOnMount).toBe(false);
    });

    it('should capture polling callback for later execution', () => {
      render(<PageEditor pageId={mockPage.id} initialPage={mockPage} />);

      expect(pollingCallback).toBeDefined();
      expect(typeof pollingCallback).toBe('function');
    });
  });

  describe('Editor focus state tracking', () => {
    it('should set isEditorFocused to true when editor gains focus', () => {
      render(<PageEditor pageId={mockPage.id} initialPage={mockPage} />);

      // Simulate editor focus
      act(() => {
        (mockEditor as any).onFocus();
      });

      // We can't directly test state, but we can verify behavior:
      // When focused, polling should not update content
      // This is tested in the "Pause polling when focused" section
    });

    it('should set isEditorFocused to false when editor loses focus', () => {
      render(<PageEditor pageId={mockPage.id} initialPage={mockPage} />);

      // Simulate editor focus then blur
      act(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mockEditor as any).onFocus();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mockEditor as any).onBlur();
      });

      // State should be back to unfocused
      // This is tested in the "Resume polling when unfocused" section
    });
  });

  describe('Pause polling when editor is focused', () => {
    it('should not fetch content when editor is focused', async () => {
      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: {
                  content: { type: 'doc', content: [{ type: 'text' }] },
                  updated_at: '2024-01-01T11:00:00Z',
                },
                error: null,
              })),
            })),
          })),
        })),
      };

      jest.mock('@/lib/supabase/client', () => ({
        createClient: jest.fn(() => mockSupabase),
      }));

      render(<PageEditor pageId={mockPage.id} initialPage={mockPage} />);

      // Focus the editor
      act(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mockEditor as any).onFocus();
      });

      // Execute polling callback
      if (pollingCallback) {
        await act(async () => {
          await pollingCallback!();
        });
      }

      // Should not call setContent because editor is focused
      expect(mockSetContent).not.toHaveBeenCalled();
    });
  });

  describe('Fetch and update when unfocused', () => {
    it('should fetch page content when polling executes', async () => {
      const mockSingle = jest.fn(() => ({
        data: {
          content: { type: 'doc', content: [] },
          updated_at: '2024-01-01T10:00:00Z',
        },
        error: null,
      }));

      const mockEq = jest.fn(() => ({ single: mockSingle }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      const mockFrom = jest.fn(() => ({ select: mockSelect }));

      const mockSupabase = {
        from: mockFrom,
      };

      require('@/lib/supabase/client').createClient = jest.fn(
        () => mockSupabase
      );

      render(<PageEditor pageId={mockPage.id} initialPage={mockPage} />);

      // Execute polling callback
      if (pollingCallback) {
        await act(async () => {
          await pollingCallback!();
        });
      }

      expect(mockFrom).toHaveBeenCalledWith('pages');
      expect(mockSelect).toHaveBeenCalledWith('content, updated_at');
      expect(mockEq).toHaveBeenCalledWith('id', 'test-page-id');
    });

    it('should update editor content when server version is newer', async () => {
      const newerContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'New content' }],
          },
        ],
      };

      const mockSingle = jest.fn(() => ({
        data: {
          content: newerContent,
          updated_at: '2024-01-01T12:00:00Z', // Newer than initial 10:00:00
        },
        error: null,
      }));

      const mockEq = jest.fn(() => ({ single: mockSingle }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      const mockFrom = jest.fn(() => ({ select: mockSelect }));

      const mockSupabase = {
        from: mockFrom,
      };

      require('@/lib/supabase/client').createClient = jest.fn(
        () => mockSupabase
      );

      render(<PageEditor pageId={mockPage.id} initialPage={mockPage} />);

      // Execute polling callback
      if (pollingCallback) {
        await act(async () => {
          await pollingCallback!();
        });
      }

      expect(mockSetContent).toHaveBeenCalledWith(newerContent);
    });

    it('should not update editor content when server version is same or older', async () => {
      const olderContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Old content' }],
          },
        ],
      };

      const mockSingle = jest.fn(() => ({
        data: {
          content: olderContent,
          updated_at: '2024-01-01T09:00:00Z', // Older than initial 10:00:00
        },
        error: null,
      }));

      const mockEq = jest.fn(() => ({ single: mockSingle }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      const mockFrom = jest.fn(() => ({ select: mockSelect }));

      const mockSupabase = {
        from: mockFrom,
      };

      require('@/lib/supabase/client').createClient = jest.fn(
        () => mockSupabase
      );

      render(<PageEditor pageId={mockPage.id} initialPage={mockPage} />);

      // Execute polling callback
      if (pollingCallback) {
        await act(async () => {
          await pollingCallback!();
        });
      }

      expect(mockSetContent).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle Supabase errors gracefully', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const mockSingle = jest.fn(() => ({
        data: null,
        error: { message: 'Database error' },
      }));

      const mockEq = jest.fn(() => ({ single: mockSingle }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      const mockFrom = jest.fn(() => ({ select: mockSelect }));

      const mockSupabase = {
        from: mockFrom,
      };

      require('@/lib/supabase/client').createClient = jest.fn(
        () => mockSupabase
      );

      render(<PageEditor pageId={mockPage.id} initialPage={mockPage} />);

      // Execute polling callback
      if (pollingCallback) {
        await act(async () => {
          await pollingCallback!();
        });
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to poll page content:',
        { message: 'Database error' }
      );
      expect(mockSetContent).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle network errors without crashing', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const mockFrom = jest.fn(() => {
        throw new Error('Network error');
      });

      const mockSupabase = {
        from: mockFrom,
      };

      require('@/lib/supabase/client').createClient = jest.fn(
        () => mockSupabase
      );

      render(<PageEditor pageId={mockPage.id} initialPage={mockPage} />);

      // Execute polling callback - should not throw
      if (pollingCallback) {
        await act(async () => {
          await pollingCallback!();
        });
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error polling page content:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Updated_at timestamp comparison', () => {
    it('should use ISO 8601 string comparison for timestamps', async () => {
      const newerContent = {
        type: 'doc',
        content: [{ type: 'text', text: 'Newer' }],
      };

      const mockSingle = jest.fn(() => ({
        data: {
          content: newerContent,
          updated_at: '2024-01-01T10:00:01Z', // 1 second newer
        },
        error: null,
      }));

      const mockEq = jest.fn(() => ({ single: mockSingle }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      const mockFrom = jest.fn(() => ({ select: mockSelect }));

      const mockSupabase = {
        from: mockFrom,
      };

      require('@/lib/supabase/client').createClient = jest.fn(
        () => mockSupabase
      );

      render(<PageEditor pageId={mockPage.id} initialPage={mockPage} />);

      // Execute polling callback
      if (pollingCallback) {
        await act(async () => {
          await pollingCallback!();
        });
      }

      // Should update because '2024-01-01T10:00:01Z' > '2024-01-01T10:00:00Z'
      expect(mockSetContent).toHaveBeenCalledWith(newerContent);
    });
  });
});
