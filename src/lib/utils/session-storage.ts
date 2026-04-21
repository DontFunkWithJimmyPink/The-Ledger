/**
 * Session storage utilities for editor content persistence
 *
 * This module provides utilities for storing and retrieving editor content
 * from sessionStorage, used for preserving unsaved changes when auth session expires.
 */

const EDITOR_CONTENT_PREFIX = 'ledger_editor_content_';
const EDITOR_TITLE_PREFIX = 'ledger_editor_title_';

export interface StoredEditorState {
  content: Record<string, any>;
  title: string;
  timestamp: number;
}

/**
 * Store editor content in sessionStorage keyed by pageId
 *
 * @param pageId - The ID of the page being edited
 * @param content - The Tiptap JSON content
 * @param title - The page title
 */
export function storeEditorContent(
  pageId: string,
  content: Record<string, any>,
  title: string
): void {
  try {
    const state: StoredEditorState = {
      content,
      title,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(
      `${EDITOR_CONTENT_PREFIX}${pageId}`,
      JSON.stringify(state)
    );
  } catch (error) {
    console.error('Failed to store editor content in sessionStorage:', error);
  }
}

/**
 * Retrieve stored editor content from sessionStorage
 *
 * @param pageId - The ID of the page to retrieve
 * @returns The stored editor state or null if not found
 */
export function retrieveEditorContent(
  pageId: string
): StoredEditorState | null {
  try {
    const stored = sessionStorage.getItem(`${EDITOR_CONTENT_PREFIX}${pageId}`);
    if (!stored) {
      return null;
    }
    return JSON.parse(stored) as StoredEditorState;
  } catch (error) {
    console.error(
      'Failed to retrieve editor content from sessionStorage:',
      error
    );
    return null;
  }
}

/**
 * Clear stored editor content from sessionStorage
 *
 * @param pageId - The ID of the page to clear
 */
export function clearEditorContent(pageId: string): void {
  try {
    sessionStorage.removeItem(`${EDITOR_CONTENT_PREFIX}${pageId}`);
  } catch (error) {
    console.error('Failed to clear editor content from sessionStorage:', error);
  }
}

/**
 * Check if stored editor content exists and is fresh (< 1 hour old)
 *
 * @param pageId - The ID of the page to check
 * @returns true if content exists and is fresh
 */
export function hasRecentEditorContent(pageId: string): boolean {
  const stored = retrieveEditorContent(pageId);
  if (!stored) {
    return false;
  }

  // Consider content fresh if it's less than 1 hour old
  const ONE_HOUR = 60 * 60 * 1000;
  return Date.now() - stored.timestamp < ONE_HOUR;
}
