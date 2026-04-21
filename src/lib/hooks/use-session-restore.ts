import { useEffect, useState } from 'react';
import {
  retrieveEditorContent,
  clearEditorContent,
  type StoredEditorState,
} from '@/lib/utils/session-storage';

/**
 * Hook for restoring editor content from sessionStorage after re-login
 *
 * This hook checks sessionStorage for any stored editor content for the given pageId
 * and returns it if found. It also provides a method to clear the stored content
 * once it has been successfully restored.
 *
 * @param pageId - The ID of the page to check for stored content
 * @returns Object containing stored content (if any) and a clear function
 */
export function useSessionRestore(pageId: string) {
  const [restoredContent, setRestoredContent] =
    useState<StoredEditorState | null>(null);

  useEffect(() => {
    // Check for stored content on mount
    const stored = retrieveEditorContent(pageId);
    if (stored) {
      setRestoredContent(stored);
    }
  }, [pageId]);

  const clearStored = () => {
    clearEditorContent(pageId);
    setRestoredContent(null);
  };

  return {
    restoredContent,
    clearStored,
  };
}
