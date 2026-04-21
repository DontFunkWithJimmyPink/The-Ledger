import { render, screen, waitFor } from '@testing-library/react';
import { DrawingCanvas } from './DrawingCanvas';
import { createClient } from '@/lib/supabase/client';
import { useAutosave } from '@/lib/hooks/use-autosave';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import type { AppState } from '@excalidraw/excalidraw/types/types';

// Mock Supabase client
jest.mock('@/lib/supabase/client');

// Mock useAutosave hook
jest.mock('@/lib/hooks/use-autosave');

// Mock Excalidraw
jest.mock('@excalidraw/excalidraw', () => ({
  Excalidraw: jest.fn(({ onChange, initialData }) => (
    <div data-testid="excalidraw-canvas">
      <button
        data-testid="excalidraw-trigger-change"
        onClick={() =>
          onChange &&
          onChange([{ id: 'test-element', type: 'rectangle' }], { zoom: 1 })
        }
      >
        Trigger Change
      </button>
      <div data-testid="initial-elements">
        {JSON.stringify(initialData?.elements || [])}
      </div>
      <div data-testid="initial-appstate">
        {JSON.stringify(initialData?.appState || {})}
      </div>
    </div>
  )),
}));

describe('DrawingCanvas', () => {
  const mockPageId = 'page-123';
  const mockTrigger = jest.fn();
  const mockSupabaseUpsert = jest.fn();
  const mockSupabaseFrom = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup useAutosave mock
    (useAutosave as jest.Mock).mockReturnValue({
      status: 'idle',
      trigger: mockTrigger,
      reset: jest.fn(),
    });

    // Setup Supabase from mock
    mockSupabaseUpsert.mockResolvedValue({ error: null });
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'drawings') {
        return {
          upsert: mockSupabaseUpsert,
        };
      }
      return {};
    });

    // Setup complete Supabase client mock
    (createClient as jest.Mock).mockReturnValue({
      from: mockSupabaseFrom,
    });
  });

  describe('Rendering', () => {
    it('should render Excalidraw canvas', () => {
      render(<DrawingCanvas pageId={mockPageId} />);

      expect(screen.getByTestId('excalidraw-canvas')).toBeInTheDocument();
    });

    it('should render with initial elements', () => {
      const initialElements = [
        { id: 'elem-1', type: 'rectangle' },
      ] as ExcalidrawElement[];
      render(
        <DrawingCanvas pageId={mockPageId} initialElements={initialElements} />
      );

      const elementsDisplay = screen.getByTestId('initial-elements');
      expect(elementsDisplay.textContent).toBe(JSON.stringify(initialElements));
    });

    it('should render with initial app state', () => {
      const initialAppState = {
        viewBackgroundColor: '#fff',
      } as Partial<AppState>;
      render(
        <DrawingCanvas pageId={mockPageId} initialAppState={initialAppState} />
      );

      const appStateDisplay = screen.getByTestId('initial-appstate');
      expect(appStateDisplay.textContent).toBe(JSON.stringify(initialAppState));
    });

    it('should render with border and rounded corners', () => {
      const { container } = render(<DrawingCanvas pageId={mockPageId} />);

      const wrapper = container.querySelector(
        '.border.border-leather-300.rounded-lg'
      );
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Autosave Integration', () => {
    it('should initialize useAutosave with correct options', () => {
      render(<DrawingCanvas pageId={mockPageId} />);

      expect(useAutosave).toHaveBeenCalledWith(
        expect.objectContaining({
          delay: 500,
          jitter: 100,
        })
      );
    });

    it('should call trigger when elements change', async () => {
      render(<DrawingCanvas pageId={mockPageId} />);

      const triggerButton = screen.getByTestId('excalidraw-trigger-change');
      triggerButton.click();

      await waitFor(() => {
        expect(mockTrigger).toHaveBeenCalled();
      });
    });

    it('should not trigger autosave on initial render with empty data', () => {
      render(<DrawingCanvas pageId={mockPageId} />);

      // Should not trigger on mount with empty data
      expect(mockTrigger).not.toHaveBeenCalled();
    });
  });

  describe('Save Status Display', () => {
    it('should display "Saving…" when status is saving', () => {
      (useAutosave as jest.Mock).mockReturnValue({
        status: 'saving',
        trigger: mockTrigger,
        reset: jest.fn(),
      });

      render(<DrawingCanvas pageId={mockPageId} />);

      expect(screen.getByText('Saving…')).toBeInTheDocument();
    });

    it('should display "Saved" when status is saved', () => {
      (useAutosave as jest.Mock).mockReturnValue({
        status: 'saved',
        trigger: mockTrigger,
        reset: jest.fn(),
      });

      render(<DrawingCanvas pageId={mockPageId} />);

      expect(screen.getByText('Saved')).toBeInTheDocument();
    });

    it('should display error message when status is error', () => {
      (useAutosave as jest.Mock).mockReturnValue({
        status: 'error',
        trigger: mockTrigger,
        reset: jest.fn(),
      });

      render(<DrawingCanvas pageId={mockPageId} />);

      expect(screen.getByText('Save failed — retrying')).toBeInTheDocument();
    });

    it('should not display status when idle', () => {
      (useAutosave as jest.Mock).mockReturnValue({
        status: 'idle',
        trigger: mockTrigger,
        reset: jest.fn(),
      });

      render(<DrawingCanvas pageId={mockPageId} />);

      expect(screen.queryByText('Saving…')).not.toBeInTheDocument();
      expect(screen.queryByText('Saved')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Save failed — retrying')
      ).not.toBeInTheDocument();
    });
  });

  describe('Supabase Integration', () => {
    it('should call upsert with correct parameters on save', async () => {
      let savedOnSave: (() => Promise<void>) | undefined;

      (useAutosave as jest.Mock).mockImplementation(({ onSave }) => {
        savedOnSave = onSave as () => Promise<void>;
        return {
          status: 'idle',
          trigger: mockTrigger,
          reset: jest.fn(),
        };
      });

      render(<DrawingCanvas pageId={mockPageId} />);

      // Trigger a change to update state
      const triggerButton = screen.getByTestId('excalidraw-trigger-change');
      triggerButton.click();

      // Wait for state to update
      await waitFor(() => {
        expect(mockTrigger).toHaveBeenCalled();
      });

      // Now call the onSave function that was passed to useAutosave
      if (savedOnSave) {
        await savedOnSave();

        expect(mockSupabaseFrom).toHaveBeenCalledWith('drawings');
        expect(mockSupabaseUpsert).toHaveBeenCalledWith(
          expect.objectContaining({
            page_id: mockPageId,
            elements: [{ id: 'test-element', type: 'rectangle' }],
            app_state: { zoom: 1 },
          }),
          { onConflict: 'page_id' }
        );
      }
    });

    it('should include updated_at timestamp in upsert', async () => {
      let savedOnSave: (() => Promise<void>) | undefined;

      (useAutosave as jest.Mock).mockImplementation(({ onSave }) => {
        savedOnSave = onSave as () => Promise<void>;
        return {
          status: 'idle',
          trigger: mockTrigger,
          reset: jest.fn(),
        };
      });

      render(<DrawingCanvas pageId={mockPageId} />);

      // Trigger a change
      const triggerButton = screen.getByTestId('excalidraw-trigger-change');
      triggerButton.click();

      await waitFor(() => {
        expect(mockTrigger).toHaveBeenCalled();
      });

      if (savedOnSave) {
        await savedOnSave();

        expect(mockSupabaseUpsert).toHaveBeenCalledWith(
          expect.objectContaining({
            updated_at: expect.any(String),
          }),
          { onConflict: 'page_id' }
        );
      }
    });

    it('should throw error on save failure', async () => {
      const mockError = { message: 'Database error' };
      mockSupabaseUpsert.mockResolvedValue({ error: mockError });

      let savedOnSave: (() => Promise<void>) | undefined;

      (useAutosave as jest.Mock).mockImplementation(({ onSave }) => {
        savedOnSave = onSave as () => Promise<void>;
        return {
          status: 'idle',
          trigger: mockTrigger,
          reset: jest.fn(),
        };
      });

      render(<DrawingCanvas pageId={mockPageId} />);

      // Trigger a change
      const triggerButton = screen.getByTestId('excalidraw-trigger-change');
      triggerButton.click();

      await waitFor(() => {
        expect(mockTrigger).toHaveBeenCalled();
      });

      if (savedOnSave) {
        await expect(savedOnSave()).rejects.toEqual(mockError);
      }
    });

    it('should log errors to console without exposing to user', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const mockError = { message: 'Database error' };
      mockSupabaseUpsert.mockResolvedValue({ error: mockError });

      let savedOnSave: (() => Promise<void>) | undefined;

      (useAutosave as jest.Mock).mockImplementation(({ onSave }) => {
        savedOnSave = onSave as () => Promise<void>;
        return {
          status: 'idle',
          trigger: mockTrigger,
          reset: jest.fn(),
        };
      });

      render(<DrawingCanvas pageId={mockPageId} />);

      // Trigger a change
      const triggerButton = screen.getByTestId('excalidraw-trigger-change');
      triggerButton.click();

      await waitFor(() => {
        expect(mockTrigger).toHaveBeenCalled();
      });

      if (savedOnSave) {
        try {
          await savedOnSave();
        } catch (error) {
          // Expected to throw
        }

        // Verify console.error was called with the error
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to save drawing:',
          mockError
        );
      }

      consoleErrorSpy.mockRestore();
    });
  });
});
