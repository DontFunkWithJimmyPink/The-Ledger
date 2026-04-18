/**
 * CustomTaskItem Extension
 *
 * Extends @tiptap/extension-task-item to add support for due dates on task items.
 * This extension adds a `dueDate` attribute alongside the standard `checked` attribute,
 * allowing tasks to have associated deadlines that can be stored and rendered.
 *
 * @see https://www.tiptap.dev/api/nodes/task-item
 */

import { TaskItem } from '@tiptap/extension-task-item';
import { mergeAttributes } from '@tiptap/core';

export interface CustomTaskItemOptions {
  /**
   * A callback function that is called when the checkbox is clicked while the editor is in readonly mode.
   * @param node The prosemirror node of the task item
   * @param checked The new checked state
   * @returns boolean
   */
  onReadOnlyChecked?: (node: any, checked: boolean) => boolean;
  /**
   * Controls whether the task items can be nested or not.
   * @default false
   * @example true
   */
  nested: boolean;
  /**
   * HTML attributes to add to the task item element.
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, any>;
  /**
   * The node type for taskList nodes
   * @default 'taskList'
   * @example 'myCustomTaskList'
   */
  taskListTypeName: string;
  /**
   * Accessibility options for the task item.
   * @default {}
   * @example
   * ```js
   * {
   *   checkboxLabel: (node) => `Task item: ${node.textContent || 'empty task item'}`
   * }
   */
  a11y?: {
    checkboxLabel?: (node: any, checked: boolean) => string;
  };
}

/**
 * CustomTaskItem Extension
 *
 * Extends the base TaskItem extension to add a dueDate attribute.
 * The dueDate is stored as an ISO 8601 string and can be used for:
 * - Setting task deadlines
 * - Triggering reminders
 * - Filtering/sorting tasks by due date
 * - Visual indicators for overdue tasks
 *
 * @example
 * ```typescript
 * import { CustomTaskItem } from '@/components/editor/extensions/CustomTaskItem';
 *
 * const editor = useEditor({
 *   extensions: [
 *     // ... other extensions
 *     CustomTaskItem,
 *   ],
 * });
 * ```
 */
export const CustomTaskItem = TaskItem.extend<CustomTaskItemOptions>({
  name: 'taskItem',

  addAttributes() {
    // Extend parent attributes (checked) and add dueDate
    return {
      ...this.parent?.(),
      dueDate: {
        default: null,
        keepOnSplit: false,
        parseHTML: (element) => {
          const dueDateAttr = element.getAttribute('data-due-date');
          // Return null if not present or empty, otherwise return the ISO string
          return dueDateAttr || null;
        },
        renderHTML: (attributes) => {
          // Only render the attribute if dueDate is set
          if (!attributes.dueDate) {
            return {};
          }
          return {
            'data-due-date': attributes.dueDate,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `li[data-type="${this.name}"]`,
        priority: 51,
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'li',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': this.name,
      }),
      [
        'label',
        [
          'input',
          {
            type: 'checkbox',
            checked: node.attrs.checked ? 'checked' : null,
          },
        ],
        ['span'],
      ],
      ['div', 0],
    ];
  },
});

export default CustomTaskItem;
