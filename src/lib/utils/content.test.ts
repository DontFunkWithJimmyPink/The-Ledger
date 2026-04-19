import { extractTiptapText, extractTaskItems, truncateText } from './content';

describe('content utility', () => {
  describe('truncateText', () => {
    it('should return text as-is if shorter than maxLength', () => {
      expect(truncateText('Short text', 20)).toBe('Short text');
    });

    it('should return text as-is if equal to maxLength', () => {
      expect(truncateText('Exactly ten', 11)).toBe('Exactly ten');
    });

    it('should truncate text longer than maxLength and add ellipsis', () => {
      expect(
        truncateText('This is a very long text that needs truncating', 20)
      ).toBe('This is a very long...');
    });

    it('should handle empty string', () => {
      expect(truncateText('', 10)).toBe('');
    });

    it('should trim whitespace before adding ellipsis', () => {
      expect(truncateText('Hello world    ', 8)).toBe('Hello wo...');
    });

    it('should handle maxLength of 0', () => {
      expect(truncateText('Hello', 0)).toBe('...');
    });

    it('should handle maxLength of 1', () => {
      expect(truncateText('Hello', 1)).toBe('H...');
    });
  });

  describe('extractTiptapText', () => {
    it('should return empty string for null content', () => {
      expect(extractTiptapText(null)).toBe('');
    });

    it('should return empty string for empty object', () => {
      expect(extractTiptapText({})).toBe('');
    });

    it('should extract text from a simple text node', () => {
      const content = { type: 'text', text: 'Hello world' };
      expect(extractTiptapText(content)).toBe('Hello world');
    });

    it('should extract text from a paragraph with single text node', () => {
      const content = {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Hello world' }],
      };
      expect(extractTiptapText(content)).toBe('Hello world');
    });

    it('should concatenate multiple text nodes directly', () => {
      const content = {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Hello ' },
          { type: 'text', text: 'world' },
          { type: 'text', text: '!' },
        ],
      };
      expect(extractTiptapText(content)).toBe('Hello world!');
    });

    it('should extract text from nested paragraph structure', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'First paragraph' }],
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Second paragraph' }],
          },
        ],
      };
      expect(extractTiptapText(content)).toBe(
        'First paragraph Second paragraph'
      );
    });

    it('should extract text from heading nodes', () => {
      const content = {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Main Title' }],
      };
      expect(extractTiptapText(content)).toBe('Main Title');
    });

    it('should extract text from bold/italic marks', () => {
      const content = {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Normal text with ' },
          { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
          { type: 'text', text: ' and ' },
          { type: 'text', text: 'italic', marks: [{ type: 'italic' }] },
          { type: 'text', text: ' words' },
        ],
      };
      expect(extractTiptapText(content)).toBe(
        'Normal text with bold and italic words'
      );
    });

    it('should extract text from bullet list', () => {
      const content = {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'First item' }],
              },
            ],
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Second item' }],
              },
            ],
          },
        ],
      };
      expect(extractTiptapText(content)).toBe('First item Second item');
    });

    it('should extract text from ordered list', () => {
      const content = {
        type: 'orderedList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Step one' }],
              },
            ],
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Step two' }],
              },
            ],
          },
        ],
      };
      expect(extractTiptapText(content)).toBe('Step one Step two');
    });

    it('should extract text from task list', () => {
      const content = {
        type: 'taskList',
        content: [
          {
            type: 'taskItem',
            attrs: { checked: false },
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Buy milk' }],
              },
            ],
          },
          {
            type: 'taskItem',
            attrs: { checked: true },
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Walk dog' }],
              },
            ],
          },
        ],
      };
      expect(extractTiptapText(content)).toBe('Buy milk Walk dog');
    });

    it('should extract text from blockquote', () => {
      const content = {
        type: 'blockquote',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'This is a quote' }],
          },
        ],
      };
      expect(extractTiptapText(content)).toBe('This is a quote');
    });

    it('should extract text from code block', () => {
      const content = {
        type: 'codeBlock',
        content: [{ type: 'text', text: 'const x = 42;' }],
      };
      expect(extractTiptapText(content)).toBe('const x = 42;');
    });

    it('should handle complex nested structure', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'My Notes' }],
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Introduction paragraph.' }],
          },
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Point one' }],
                  },
                ],
              },
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Point two' }],
                  },
                ],
              },
            ],
          },
          {
            type: 'taskList',
            content: [
              {
                type: 'taskItem',
                attrs: { checked: false },
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Task one' }],
                  },
                ],
              },
            ],
          },
        ],
      };
      expect(extractTiptapText(content)).toBe(
        'My Notes Introduction paragraph. Point one Point two Task one'
      );
    });

    it('should handle text node without text property', () => {
      const content = { type: 'text' };
      expect(extractTiptapText(content)).toBe('');
    });

    it('should handle empty content array', () => {
      const content = {
        type: 'paragraph',
        content: [],
      };
      expect(extractTiptapText(content)).toBe('');
    });

    it('should handle node without content property', () => {
      const content = {
        type: 'hardBreak',
      };
      expect(extractTiptapText(content)).toBe('');
    });

    it('should trim extra whitespace from result', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: '  Multiple ' }],
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: ' spaces  ' }],
          },
        ],
      };
      // Paragraphs are block-level, joined with space, and trimmed
      expect(extractTiptapText(content)).toBe('Multiple   spaces');
    });
  });

  describe('extractTaskItems', () => {
    it('should return empty array for null content', () => {
      expect(extractTaskItems(null)).toEqual([]);
    });

    it('should return empty array for empty object', () => {
      expect(extractTaskItems({})).toEqual([]);
    });

    it('should return empty array for content without tasks', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Just a paragraph' }],
          },
        ],
      };
      expect(extractTaskItems(content)).toEqual([]);
    });

    it('should extract single unchecked task', () => {
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
                    content: [{ type: 'text', text: 'Buy milk' }],
                  },
                ],
              },
            ],
          },
        ],
      };

      const tasks = extractTaskItems(content);
      expect(tasks).toHaveLength(1);
      expect(tasks[0]).toEqual({
        index: 0,
        text: 'Buy milk',
        checked: false,
      });
    });

    it('should extract single checked task', () => {
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
                    content: [{ type: 'text', text: 'Walk dog' }],
                  },
                ],
              },
            ],
          },
        ],
      };

      const tasks = extractTaskItems(content);
      expect(tasks).toHaveLength(1);
      expect(tasks[0]).toEqual({
        index: 0,
        text: 'Walk dog',
        checked: true,
      });
    });

    it('should extract multiple tasks from single taskList', () => {
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
                    content: [{ type: 'text', text: 'Buy milk' }],
                  },
                ],
              },
              {
                type: 'taskItem',
                attrs: { checked: true },
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Walk dog' }],
                  },
                ],
              },
              {
                type: 'taskItem',
                attrs: { checked: false },
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Read book' }],
                  },
                ],
              },
            ],
          },
        ],
      };

      const tasks = extractTaskItems(content);
      expect(tasks).toHaveLength(3);
      expect(tasks).toEqual([
        { index: 0, text: 'Buy milk', checked: false },
        { index: 1, text: 'Walk dog', checked: true },
        { index: 2, text: 'Read book', checked: false },
      ]);
    });

    it('should extract tasks from multiple taskLists with continuous indexing', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Morning tasks:' }],
          },
          {
            type: 'taskList',
            content: [
              {
                type: 'taskItem',
                attrs: { checked: false },
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Make coffee' }],
                  },
                ],
              },
              {
                type: 'taskItem',
                attrs: { checked: false },
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Check email' }],
                  },
                ],
              },
            ],
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Evening tasks:' }],
          },
          {
            type: 'taskList',
            content: [
              {
                type: 'taskItem',
                attrs: { checked: true },
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Dinner prep' }],
                  },
                ],
              },
              {
                type: 'taskItem',
                attrs: { checked: false },
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Read' }],
                  },
                ],
              },
            ],
          },
        ],
      };

      const tasks = extractTaskItems(content);
      expect(tasks).toHaveLength(4);
      expect(tasks).toEqual([
        { index: 0, text: 'Make coffee', checked: false },
        { index: 1, text: 'Check email', checked: false },
        { index: 2, text: 'Dinner prep', checked: true },
        { index: 3, text: 'Read', checked: false },
      ]);
    });

    it('should handle taskItem without attrs property', () => {
      const content = {
        type: 'taskList',
        content: [
          {
            type: 'taskItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Task without attrs' }],
              },
            ],
          },
        ],
      };

      const tasks = extractTaskItems(content);
      expect(tasks).toHaveLength(1);
      expect(tasks[0]).toEqual({
        index: 0,
        text: 'Task without attrs',
        checked: false, // Default to false
      });
    });

    it('should handle taskItem without checked attribute', () => {
      const content = {
        type: 'taskList',
        content: [
          {
            type: 'taskItem',
            attrs: {},
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Task without checked' }],
              },
            ],
          },
        ],
      };

      const tasks = extractTaskItems(content);
      expect(tasks).toHaveLength(1);
      expect(tasks[0]).toEqual({
        index: 0,
        text: 'Task without checked',
        checked: false, // Default to false
      });
    });

    it('should extract text from task with rich formatting', () => {
      const content = {
        type: 'taskList',
        content: [
          {
            type: 'taskItem',
            attrs: { checked: false },
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'text', text: 'Buy ' },
                  { type: 'text', text: 'organic', marks: [{ type: 'bold' }] },
                  { type: 'text', text: ' milk' },
                ],
              },
            ],
          },
        ],
      };

      const tasks = extractTaskItems(content);
      expect(tasks).toHaveLength(1);
      expect(tasks[0]).toEqual({
        index: 0,
        text: 'Buy organic milk',
        checked: false,
      });
    });

    it('should extract text from task with multiple paragraphs', () => {
      const content = {
        type: 'taskList',
        content: [
          {
            type: 'taskItem',
            attrs: { checked: false },
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'First paragraph' }],
              },
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Second paragraph' }],
              },
            ],
          },
        ],
      };

      const tasks = extractTaskItems(content);
      expect(tasks).toHaveLength(1);
      expect(tasks[0]).toEqual({
        index: 0,
        text: 'First paragraph Second paragraph',
        checked: false,
      });
    });

    it('should handle empty taskList', () => {
      const content = {
        type: 'taskList',
        content: [],
      };

      expect(extractTaskItems(content)).toEqual([]);
    });

    it('should handle taskList without content property', () => {
      const content = {
        type: 'taskList',
      };

      expect(extractTaskItems(content)).toEqual([]);
    });

    it('should skip non-taskItem nodes in taskList', () => {
      const content = {
        type: 'taskList',
        content: [
          {
            type: 'taskItem',
            attrs: { checked: false },
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Valid task' }],
              },
            ],
          },
          {
            type: 'paragraph', // Should be ignored
            content: [{ type: 'text', text: 'Not a task' }],
          },
        ],
      };

      const tasks = extractTaskItems(content);
      expect(tasks).toHaveLength(1);
      expect(tasks[0]).toEqual({
        index: 0,
        text: 'Valid task',
        checked: false,
      });
    });

    it('should handle complex document with mixed content', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Project Plan' }],
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Here are the tasks:' }],
          },
          {
            type: 'taskList',
            content: [
              {
                type: 'taskItem',
                attrs: { checked: true },
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Setup repository' }],
                  },
                ],
              },
              {
                type: 'taskItem',
                attrs: { checked: false },
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Write tests' }],
                  },
                ],
              },
            ],
          },
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Regular list item' }],
                  },
                ],
              },
            ],
          },
          {
            type: 'taskList',
            content: [
              {
                type: 'taskItem',
                attrs: { checked: false },
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Deploy' }],
                  },
                ],
              },
            ],
          },
        ],
      };

      const tasks = extractTaskItems(content);
      expect(tasks).toHaveLength(3);
      expect(tasks).toEqual([
        { index: 0, text: 'Setup repository', checked: true },
        { index: 1, text: 'Write tests', checked: false },
        { index: 2, text: 'Deploy', checked: false },
      ]);
    });

    it('should handle task with empty text content', () => {
      const content = {
        type: 'taskList',
        content: [
          {
            type: 'taskItem',
            attrs: { checked: false },
            content: [
              {
                type: 'paragraph',
                content: [],
              },
            ],
          },
        ],
      };

      const tasks = extractTaskItems(content);
      expect(tasks).toHaveLength(1);
      expect(tasks[0]).toEqual({
        index: 0,
        text: '',
        checked: false,
      });
    });
  });
});
