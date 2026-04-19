/**
 * Content Utility
 *
 * Functions for working with Tiptap JSON content (ProseMirror format).
 * Used for extracting text and task items from rich text editor content.
 */

/**
 * TaskItemData
 *
 * Represents a task item extracted from Tiptap JSON content.
 * Used for syncing task items to the database.
 */
export interface TaskItemData {
  /** Zero-based index of the task item within the taskList */
  index: number;
  /** Plain text content of the task */
  text: string;
  /** Whether the task is checked/completed */
  checked: boolean;
}

/**
 * Extract plain text from a Tiptap JSON document (ProseMirror format).
 *
 * Recursively walks the content tree and concatenates all text nodes.
 * This mirrors the PostgreSQL extract_tiptap_text function in the database schema.
 *
 * @param content - Tiptap JSON content (ProseMirror format)
 * @returns Plain text string with all text content concatenated
 *
 * @example
 * const content = {
 *   type: 'doc',
 *   content: [
 *     {
 *       type: 'paragraph',
 *       content: [{ type: 'text', text: 'Hello ' }, { type: 'text', text: 'world!' }]
 *     }
 *   ]
 * };
 * extractTiptapText(content); // Returns 'Hello world!'
 *
 * @example
 * // Empty or null content
 * extractTiptapText(null); // Returns ''
 * extractTiptapText({}); // Returns ''
 */
export function extractTiptapText(content: Record<string, any> | null): string {
  function extract(node: Record<string, any> | null): string {
    if (!node) {
      return '';
    }

    // If this is a text node, return its text content
    if (node.type === 'text') {
      return node.text ?? '';
    }

    // If this node has child content, recursively extract text from each child
    if (node.content && Array.isArray(node.content)) {
      // Inline containers (paragraph, heading, codeBlock) should concatenate text directly
      // Block containers should add spaces between children
      const isInlineContainer =
        node.type === 'paragraph' ||
        node.type === 'heading' ||
        node.type === 'codeBlock' ||
        node.type === 'blockquote';

      if (isInlineContainer) {
        // For inline containers, concatenate all text directly
        return node.content
          .map((child: Record<string, any>) => extract(child))
          .join('');
      } else {
        // For block containers, add spaces between non-empty children
        let result = '';
        for (const child of node.content) {
          const text = extract(child);
          if (text) {
            result += (result ? ' ' : '') + text;
          }
        }
        return result;
      }
    }

    return '';
  }

  // Only trim at the root level
  return extract(content).trim();
}

/**
 * Truncate text to a maximum length with ellipsis.
 *
 * @param text - The text to truncate
 * @param maxLength - Maximum length of the text before truncation
 * @returns Truncated text with ellipsis if needed
 *
 * @example
 * truncateText('Hello world', 8); // Returns 'Hello...'
 * truncateText('Short', 10); // Returns 'Short'
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Extract task items from Tiptap JSON content.
 *
 * Walks the content tree and extracts all taskItem nodes with their index,
 * text content, and checked state. Used for syncing tasks to the database.
 *
 * Task items are indexed by their position within taskList nodes.
 * The index is zero-based and represents the position of the task within
 * its parent taskList.
 *
 * @param content - Tiptap JSON content (ProseMirror format)
 * @returns Array of TaskItemData objects
 *
 * @example
 * const content = {
 *   type: 'doc',
 *   content: [
 *     {
 *       type: 'taskList',
 *       content: [
 *         {
 *           type: 'taskItem',
 *           attrs: { checked: false },
 *           content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Buy milk' }] }]
 *         },
 *         {
 *           type: 'taskItem',
 *           attrs: { checked: true },
 *           content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Walk dog' }] }]
 *         }
 *       ]
 *     }
 *   ]
 * };
 * extractTaskItems(content);
 * // Returns:
 * // [
 * //   { index: 0, text: 'Buy milk', checked: false },
 * //   { index: 1, text: 'Walk dog', checked: true }
 * // ]
 *
 * @example
 * // Empty or null content
 * extractTaskItems(null); // Returns []
 * extractTaskItems({}); // Returns []
 */
export function extractTaskItems(
  content: Record<string, any> | null
): TaskItemData[] {
  if (!content) {
    return [];
  }

  const tasks: TaskItemData[] = [];

  /**
   * Recursively walk the content tree and extract task items.
   * Maintains a global task index counter across all taskLists.
   */
  function walk(
    node: Record<string, any>,
    taskIndexCounter: { value: number }
  ): void {
    // If this is a taskList, process its taskItem children
    if (
      node.type === 'taskList' &&
      node.content &&
      Array.isArray(node.content)
    ) {
      for (const child of node.content) {
        if (child.type === 'taskItem') {
          // Extract task data
          const checked = child.attrs?.checked ?? false;
          const text = extractTiptapText(child);

          tasks.push({
            index: taskIndexCounter.value,
            text: text,
            checked: checked,
          });

          taskIndexCounter.value++;
        }
      }
    }

    // Continue walking the tree for nested content
    if (node.content && Array.isArray(node.content)) {
      for (const child of node.content) {
        walk(child, taskIndexCounter);
      }
    }
  }

  // Start walking from the root with a task index counter
  walk(content, { value: 0 });

  return tasks;
}
