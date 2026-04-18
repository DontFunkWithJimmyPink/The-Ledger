/**
 * CustomTaskItem Extension Tests
 *
 * Tests for the CustomTaskItem Tiptap extension that extends the base TaskItem
 * to add support for due dates on task items.
 */

import { Editor } from '@tiptap/core';
import { CustomTaskItem } from './CustomTaskItem';
import { TaskList } from '@tiptap/extension-task-list';
import { Document } from '@tiptap/extension-document';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Text } from '@tiptap/extension-text';

describe('CustomTaskItem extension', () => {
  let editor: Editor;

  beforeEach(() => {
    // Create an editor instance with the necessary extensions
    editor = new Editor({
      extensions: [Document, Paragraph, Text, TaskList, CustomTaskItem],
      content: '',
    });
  });

  afterEach(() => {
    editor.destroy();
  });

  describe('extension configuration', () => {
    it('should have the correct name', () => {
      expect(CustomTaskItem.name).toBe('taskItem');
    });

    it('should be registered in the editor', () => {
      const taskItemNode = editor.schema.nodes.taskItem;
      expect(taskItemNode).toBeDefined();
    });
  });

  describe('attributes', () => {
    it('should support checked attribute from base TaskItem', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'taskList',
            content: [
              {
                type: 'taskItem',
                attrs: { checked: true, dueDate: null },
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Test task' }],
                  },
                ],
              },
            ],
          },
        ],
      };

      editor.commands.setContent(content);
      const taskItemNode = editor.state.doc.firstChild?.firstChild;

      expect(taskItemNode?.type.name).toBe('taskItem');
      expect(taskItemNode?.attrs.checked).toBe(true);
    });

    it('should support dueDate attribute', () => {
      const dueDate = '2026-12-31T23:59:59Z';
      const content = {
        type: 'doc',
        content: [
          {
            type: 'taskList',
            content: [
              {
                type: 'taskItem',
                attrs: { checked: false, dueDate },
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Task with due date' }],
                  },
                ],
              },
            ],
          },
        ],
      };

      editor.commands.setContent(content);
      const taskItemNode = editor.state.doc.firstChild?.firstChild;

      expect(taskItemNode?.type.name).toBe('taskItem');
      expect(taskItemNode?.attrs.dueDate).toBe(dueDate);
    });

    it('should have dueDate default to null', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'taskList',
            content: [
              {
                type: 'taskItem',
                attrs: { checked: false },
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Task without due date' }],
                  },
                ],
              },
            ],
          },
        ],
      };

      editor.commands.setContent(content);
      const taskItemNode = editor.state.doc.firstChild?.firstChild;

      expect(taskItemNode?.attrs.dueDate).toBe(null);
    });
  });

  describe('JSON serialization', () => {
    it('should serialize task item with dueDate to JSON', () => {
      const dueDate = '2026-05-15T14:30:00Z';
      const content = {
        type: 'doc',
        content: [
          {
            type: 'taskList',
            content: [
              {
                type: 'taskItem',
                attrs: { checked: false, dueDate },
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', text: 'Complete project proposal' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      editor.commands.setContent(content);
      const json = editor.getJSON();

      const taskItem = json.content?.[0]?.content?.[0];
      expect(taskItem?.type).toBe('taskItem');
      expect(taskItem?.attrs?.dueDate).toBe(dueDate);
      expect(taskItem?.attrs?.checked).toBe(false);
    });

    it('should serialize task item without dueDate to JSON', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'taskList',
            content: [
              {
                type: 'taskItem',
                attrs: { checked: true },
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Read documentation' }],
                  },
                ],
              },
            ],
          },
        ],
      };

      editor.commands.setContent(content);
      const json = editor.getJSON();

      const taskItem = json.content?.[0]?.content?.[0];
      expect(taskItem?.attrs?.dueDate).toBe(null);
      expect(taskItem?.attrs?.checked).toBe(true);
    });
  });

  describe('HTML parsing and rendering', () => {
    it('should parse task item with data-due-date from HTML', () => {
      const html = `
        <ul data-type="taskList">
          <li data-type="taskItem" data-checked="false" data-due-date="2026-12-31T23:59:59Z">
            <label><input type="checkbox"><span></span></label>
            <div><p>Task with due date</p></div>
          </li>
        </ul>
      `;

      editor.commands.setContent(html);
      const taskItemNode = editor.state.doc.firstChild?.firstChild;

      expect(taskItemNode?.type.name).toBe('taskItem');
      expect(taskItemNode?.attrs.dueDate).toBe('2026-12-31T23:59:59Z');
      expect(taskItemNode?.attrs.checked).toBe(false);
    });

    it('should parse task item without data-due-date from HTML', () => {
      const html = `
        <ul data-type="taskList">
          <li data-type="taskItem" data-checked="true">
            <label><input type="checkbox" checked><span></span></label>
            <div><p>Task without due date</p></div>
          </li>
        </ul>
      `;

      editor.commands.setContent(html);
      const taskItemNode = editor.state.doc.firstChild?.firstChild;

      expect(taskItemNode?.type.name).toBe('taskItem');
      expect(taskItemNode?.attrs.dueDate).toBe(null);
      expect(taskItemNode?.attrs.checked).toBe(true);
    });

    it('should render task item with dueDate to HTML', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'taskList',
            content: [
              {
                type: 'taskItem',
                attrs: { checked: false, dueDate: '2026-12-31T23:59:59Z' },
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Task with due date' }],
                  },
                ],
              },
            ],
          },
        ],
      };

      editor.commands.setContent(content);
      const html = editor.getHTML();

      expect(html).toContain('data-due-date="2026-12-31T23:59:59Z"');
      expect(html).toContain('data-type="taskItem"');
    });

    it('should not render data-due-date when dueDate is null', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'taskList',
            content: [
              {
                type: 'taskItem',
                attrs: { checked: false, dueDate: null },
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Task without due date' }],
                  },
                ],
              },
            ],
          },
        ],
      };

      editor.commands.setContent(content);
      const html = editor.getHTML();

      expect(html).not.toContain('data-due-date');
      expect(html).toContain('data-type="taskItem"');
    });
  });

  describe('integration with multiple tasks', () => {
    it('should handle multiple tasks with different due dates', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'taskList',
            content: [
              {
                type: 'taskItem',
                attrs: { checked: false, dueDate: '2026-04-20T10:00:00Z' },
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Task 1' }],
                  },
                ],
              },
              {
                type: 'taskItem',
                attrs: { checked: true, dueDate: null },
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Task 2' }],
                  },
                ],
              },
              {
                type: 'taskItem',
                attrs: { checked: false, dueDate: '2026-05-15T14:30:00Z' },
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Task 3' }],
                  },
                ],
              },
            ],
          },
        ],
      };

      editor.commands.setContent(content);
      const json = editor.getJSON();

      const tasks = json.content?.[0]?.content;
      expect(tasks).toHaveLength(3);
      expect(tasks?.[0]?.attrs?.dueDate).toBe('2026-04-20T10:00:00Z');
      expect(tasks?.[1]?.attrs?.dueDate).toBe(null);
      expect(tasks?.[2]?.attrs?.dueDate).toBe('2026-05-15T14:30:00Z');
    });
  });

  describe('backward compatibility', () => {
    it('should work with existing task items that lack dueDate attribute', () => {
      // Simulate content that was created before dueDate was added
      const oldContent = {
        type: 'doc',
        content: [
          {
            type: 'taskList',
            content: [
              {
                type: 'taskItem',
                attrs: { checked: true },
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Old task' }],
                  },
                ],
              },
            ],
          },
        ],
      };

      editor.commands.setContent(oldContent);
      const taskItemNode = editor.state.doc.firstChild?.firstChild;

      // Should default to null if not specified
      expect(taskItemNode?.attrs.dueDate).toBe(null);
      expect(taskItemNode?.attrs.checked).toBe(true);
    });
  });
});
