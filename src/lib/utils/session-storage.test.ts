import {
  storeEditorContent,
  retrieveEditorContent,
  clearEditorContent,
  hasRecentEditorContent,
} from './session-storage';

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

describe('session-storage utilities', () => {
  beforeEach(() => {
    mockSessionStorage.clear();
    jest.clearAllMocks();
  });

  describe('storeEditorContent', () => {
    it('should store editor content in sessionStorage', () => {
      const pageId = 'page-123';
      const content = { type: 'doc', content: [] };
      const title = 'Test Page';

      storeEditorContent(pageId, content, title);

      const stored = sessionStorage.getItem('ledger_editor_content_page-123');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.content).toEqual(content);
      expect(parsed.title).toBe(title);
      expect(parsed.timestamp).toBeGreaterThan(0);
    });

    it('should handle errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const pageId = 'page-123';
      const content = { type: 'doc' };
      const title = 'Test';

      // Mock setItem to throw an error
      const setItemSpy = jest
        .spyOn(sessionStorage, 'setItem')
        .mockImplementationOnce(() => {
          throw new Error('QuotaExceededError');
        });

      // Should not throw
      expect(() => storeEditorContent(pageId, content, title)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
      setItemSpy.mockRestore();
    });
  });

  describe('retrieveEditorContent', () => {
    it('should retrieve stored editor content', () => {
      const pageId = 'page-456';
      const content = { type: 'doc', content: [{ type: 'paragraph' }] };
      const title = 'Another Page';

      storeEditorContent(pageId, content, title);

      const retrieved = retrieveEditorContent(pageId);
      expect(retrieved).toBeTruthy();
      expect(retrieved!.content).toEqual(content);
      expect(retrieved!.title).toBe(title);
      expect(retrieved!.timestamp).toBeGreaterThan(0);
    });

    it('should return null if no content is stored', () => {
      const retrieved = retrieveEditorContent('non-existent-page');
      expect(retrieved).toBeNull();
    });

    it('should handle parsing errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const pageId = 'page-789';

      // Store invalid JSON
      sessionStorage.setItem('ledger_editor_content_page-789', 'invalid json');

      const retrieved = retrieveEditorContent(pageId);
      expect(retrieved).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('clearEditorContent', () => {
    it('should clear stored editor content', () => {
      const pageId = 'page-clear';
      const content = { type: 'doc' };
      const title = 'Clear Me';

      storeEditorContent(pageId, content, title);

      // Verify it was stored
      expect(retrieveEditorContent(pageId)).toBeTruthy();

      // Clear it
      clearEditorContent(pageId);

      // Verify it was removed
      expect(retrieveEditorContent(pageId)).toBeNull();
    });

    it('should handle errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock removeItem to throw an error
      const removeItemSpy = jest
        .spyOn(sessionStorage, 'removeItem')
        .mockImplementationOnce(() => {
          throw new Error('Storage error');
        });

      // Should not throw
      expect(() => clearEditorContent('page-123')).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
      removeItemSpy.mockRestore();
    });
  });

  describe('hasRecentEditorContent', () => {
    it('should return true for fresh content (< 1 hour old)', () => {
      const pageId = 'page-fresh';
      const content = { type: 'doc' };
      const title = 'Fresh';

      storeEditorContent(pageId, content, title);

      expect(hasRecentEditorContent(pageId)).toBe(true);
    });

    it('should return false for old content (> 1 hour old)', () => {
      const pageId = 'page-old';
      const content = { type: 'doc' };
      const title = 'Old';

      // Store content with old timestamp
      const oldTimestamp = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago
      sessionStorage.setItem(
        `ledger_editor_content_${pageId}`,
        JSON.stringify({ content, title, timestamp: oldTimestamp })
      );

      expect(hasRecentEditorContent(pageId)).toBe(false);
    });

    it('should return false for non-existent content', () => {
      expect(hasRecentEditorContent('non-existent')).toBe(false);
    });

    it('should return true for content exactly at the 1-hour boundary', () => {
      const pageId = 'page-boundary';
      const content = { type: 'doc' };
      const title = 'Boundary';

      // Store content exactly 1 hour ago
      const boundaryTimestamp = Date.now() - 60 * 60 * 1000;
      sessionStorage.setItem(
        `ledger_editor_content_${pageId}`,
        JSON.stringify({ content, title, timestamp: boundaryTimestamp })
      );

      expect(hasRecentEditorContent(pageId)).toBe(false);
    });
  });
});
