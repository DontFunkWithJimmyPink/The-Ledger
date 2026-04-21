import { renderHook, act } from '@testing-library/react';
import { useSessionRestore } from './use-session-restore';
import { storeEditorContent } from '@/lib/utils/session-storage';

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

describe('useSessionRestore', () => {
  beforeEach(() => {
    mockSessionStorage.clear();
  });

  it('should return null when no content is stored', () => {
    const { result } = renderHook(() => useSessionRestore('page-123'));

    expect(result.current.restoredContent).toBeNull();
  });

  it('should restore content from sessionStorage on mount', () => {
    const pageId = 'page-456';
    const content = { type: 'doc', content: [{ type: 'paragraph' }] };
    const title = 'Restored Page';

    // Store content before rendering hook
    storeEditorContent(pageId, content, title);

    const { result } = renderHook(() => useSessionRestore(pageId));

    expect(result.current.restoredContent).toBeTruthy();
    expect(result.current.restoredContent!.content).toEqual(content);
    expect(result.current.restoredContent!.title).toBe(title);
  });

  it('should clear stored content when clearStored is called', () => {
    const pageId = 'page-789';
    const content = { type: 'doc' };
    const title = 'Clear Test';

    // Store content
    storeEditorContent(pageId, content, title);

    const { result } = renderHook(() => useSessionRestore(pageId));

    // Verify content was restored
    expect(result.current.restoredContent).toBeTruthy();

    // Clear it wrapped in act
    act(() => {
      result.current.clearStored();
    });

    // Verify it's now null
    expect(result.current.restoredContent).toBeNull();

    // Verify it was removed from sessionStorage
    const stored = sessionStorage.getItem(`ledger_editor_content_${pageId}`);
    expect(stored).toBeNull();
  });

  it('should handle different pageIds independently', () => {
    const pageId1 = 'page-1';
    const pageId2 = 'page-2';
    const content1 = { type: 'doc', content: [{ type: 'heading' }] };
    const content2 = { type: 'doc', content: [{ type: 'paragraph' }] };

    storeEditorContent(pageId1, content1, 'Page 1');
    storeEditorContent(pageId2, content2, 'Page 2');

    const { result: result1 } = renderHook(() => useSessionRestore(pageId1));
    const { result: result2 } = renderHook(() => useSessionRestore(pageId2));

    expect(result1.current.restoredContent!.content).toEqual(content1);
    expect(result1.current.restoredContent!.title).toBe('Page 1');

    expect(result2.current.restoredContent!.content).toEqual(content2);
    expect(result2.current.restoredContent!.title).toBe('Page 2');
  });

  it('should not restore content from a different pageId', () => {
    const pageId = 'page-correct';
    const wrongPageId = 'page-wrong';

    storeEditorContent(wrongPageId, { type: 'doc' }, 'Wrong Page');

    const { result } = renderHook(() => useSessionRestore(pageId));

    expect(result.current.restoredContent).toBeNull();
  });
});
