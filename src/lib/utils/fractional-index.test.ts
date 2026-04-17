import { generateKeyBetween, generateNKeysBetween } from './fractional-index';

// Mock the fractional-indexing package to avoid ESM issues in Jest
jest.mock('fractional-indexing');

describe('fractional-index utility', () => {
  describe('generateKeyBetween', () => {
    it('should generate a key for an empty list (null, null)', () => {
      const key = generateKeyBetween(null, null);
      expect(key).toBe('a0');
    });

    it('should generate a key at the beginning (null, first)', () => {
      const key = generateKeyBetween(null, 'a0');
      expect(key).toBeTruthy();
      expect(key < 'a0').toBe(true);
    });

    it('should generate a key at the end (last, null)', () => {
      const key = generateKeyBetween('a0', null);
      expect(key).toBeTruthy();
      expect(key > 'a0').toBe(true);
    });

    it('should generate a key between two existing keys', () => {
      const key = generateKeyBetween('a0', 'a1');
      expect(key).toBeTruthy();
      expect(key > 'a0').toBe(true);
      expect(key < 'a1').toBe(true);
    });

    it('should generate keys that maintain lexicographic ordering', () => {
      const key1 = generateKeyBetween(null, null); // First key
      const key2 = generateKeyBetween(key1, null); // After key1
      const key3 = generateKeyBetween(key1, key2); // Between key1 and key2
      const key4 = generateKeyBetween(null, key1); // Before key1

      // Verify lexicographic ordering
      const sorted = [key1, key2, key3, key4].sort();
      expect(sorted).toEqual([key4, key1, key3, key2]);
    });

    it('should handle undefined values the same as null', () => {
      const key1 = generateKeyBetween(undefined, undefined);
      const key2 = generateKeyBetween(null, null);
      expect(key1).toBe(key2);
    });

    it('should generate different keys for consecutive calls', () => {
      const key1 = generateKeyBetween('a0', 'a1');
      const key2 = generateKeyBetween('a0', key1);
      const key3 = generateKeyBetween(key1, 'a1');

      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key2).not.toBe(key3);

      // Verify they are all unique and string-comparable
      const keys = [key1, key2, key3];
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(3);
    });

    it('should support many consecutive insertions without collision', () => {
      let prevKey = generateKeyBetween(null, null);
      const keys = [prevKey];

      // Generate 100 consecutive keys after the first
      for (let i = 0; i < 100; i++) {
        const newKey = generateKeyBetween(prevKey, null);
        keys.push(newKey);
        prevKey = newKey;
      }

      // All keys should be unique
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);

      // All keys should be in sorted order
      const sorted = [...keys].sort();
      expect(sorted).toEqual(keys);
    });
  });

  describe('generateNKeysBetween', () => {
    it('should generate n keys in an empty list', () => {
      const keys = generateNKeysBetween(null, null, 5);
      expect(keys).toHaveLength(5);
      expect(keys[0]).toBe('a0');
      expect(keys[1]).toBe('a1');
      expect(keys[2]).toBe('a2');
      expect(keys[3]).toBe('a3');
      expect(keys[4]).toBe('a4');
    });

    it('should generate 0 keys when n is 0', () => {
      const keys = generateNKeysBetween(null, null, 0);
      expect(keys).toHaveLength(0);
      expect(keys).toEqual([]);
    });

    it('should generate 1 key when n is 1', () => {
      const keys = generateNKeysBetween(null, null, 1);
      expect(keys).toHaveLength(1);
      expect(keys[0]).toBe('a0');
    });

    it('should generate n keys at the beginning', () => {
      const keys = generateNKeysBetween(null, 'a0', 3);
      expect(keys).toHaveLength(3);

      // All keys should be less than 'a0'
      keys.forEach((key) => {
        expect(key < 'a0').toBe(true);
      });

      // Keys should be in sorted order
      const sorted = [...keys].sort();
      expect(sorted).toEqual(keys);
    });

    it('should generate n keys at the end', () => {
      const keys = generateNKeysBetween('a0', null, 3);
      expect(keys).toHaveLength(3);

      // All keys should be greater than 'a0'
      keys.forEach((key) => {
        expect(key > 'a0').toBe(true);
      });

      // Keys should be in sorted order
      const sorted = [...keys].sort();
      expect(sorted).toEqual(keys);
    });

    it('should generate n keys between two existing keys', () => {
      const keys = generateNKeysBetween('a0', 'b0', 5);
      expect(keys).toHaveLength(5);

      // All keys should be between 'a0' and 'b0'
      keys.forEach((key) => {
        expect(key > 'a0').toBe(true);
        expect(key < 'b0').toBe(true);
      });

      // Keys should be in sorted order
      const sorted = [...keys].sort();
      expect(sorted).toEqual(keys);
    });

    it('should generate all unique keys', () => {
      const keys = generateNKeysBetween(null, null, 100);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(100);
    });

    it('should generate keys in lexicographic order', () => {
      const keys = generateNKeysBetween('a0', 'z0', 10);
      const sorted = [...keys].sort();
      expect(sorted).toEqual(keys);
    });

    it('should handle undefined values the same as null', () => {
      const keys1 = generateNKeysBetween(undefined, undefined, 3);
      const keys2 = generateNKeysBetween(null, null, 3);
      expect(keys1).toEqual(keys2);
    });
  });

  describe('Real-world use cases', () => {
    it('should support drag-and-drop task reordering scenario', () => {
      // Initial tasks with sort_order
      const tasks = [
        { id: 1, text: 'Task 1', sort_order: 'a0' },
        { id: 2, text: 'Task 2', sort_order: 'a1' },
        { id: 3, text: 'Task 3', sort_order: 'a2' },
        { id: 4, text: 'Task 4', sort_order: 'a3' },
      ];

      // Drag Task 4 between Task 1 and Task 2
      const newSortOrder = generateKeyBetween(
        tasks[0].sort_order,
        tasks[1].sort_order
      );
      tasks[3].sort_order = newSortOrder;

      // Sort tasks by sort_order
      const sortedTasks = [...tasks].sort((a, b) =>
        a.sort_order.localeCompare(b.sort_order)
      );

      // Verify the new order is: Task 1, Task 4, Task 2, Task 3
      expect(sortedTasks.map((t) => t.id)).toEqual([1, 4, 2, 3]);
    });

    it('should support page reordering scenario', () => {
      // Initial pages
      const pages = [
        { id: 1, title: 'Page 1', sort_order: 'a0' },
        { id: 2, title: 'Page 2', sort_order: 'a1' },
        { id: 3, title: 'Page 3', sort_order: 'a2' },
      ];

      // Move Page 1 to the end
      const newSortOrder = generateKeyBetween(pages[2].sort_order, null);
      pages[0].sort_order = newSortOrder;

      // Sort pages
      const sortedPages = [...pages].sort((a, b) =>
        a.sort_order.localeCompare(b.sort_order)
      );

      // Verify the new order is: Page 2, Page 3, Page 1
      expect(sortedPages.map((p) => p.id)).toEqual([2, 3, 1]);
    });

    it('should support bulk insert scenario', () => {
      // Insert 5 new tasks at the beginning of an existing list
      const existingFirstTask = { id: 1, sort_order: 'a0' };
      const newKeys = generateNKeysBetween(
        null,
        existingFirstTask.sort_order,
        5
      );

      // All new keys should be before the existing first task
      newKeys.forEach((key) => {
        expect(key < existingFirstTask.sort_order).toBe(true);
      });

      // New keys should be in order
      const sorted = [...newKeys].sort();
      expect(sorted).toEqual(newKeys);
    });

    it('should support inserting at the beginning of a list', () => {
      const existingTasks = [
        { id: 1, text: 'Task 1', sort_order: 'a0' },
        { id: 2, text: 'Task 2', sort_order: 'a1' },
      ];

      // Insert a new task at the beginning
      const newSortOrder = generateKeyBetween(
        null,
        existingTasks[0].sort_order
      );
      const newTask = { id: 3, text: 'New Task', sort_order: newSortOrder };

      const allTasks = [...existingTasks, newTask].sort((a, b) =>
        a.sort_order.localeCompare(b.sort_order)
      );

      // Verify the new task was inserted
      expect(allTasks).toHaveLength(3);
      // The new task should sort before 'a0'
      expect(newSortOrder < 'a0').toBe(true);
      expect(allTasks[0]).toBe(newTask);
      expect(allTasks.map((t) => t.id)).toEqual([3, 1, 2]);
    });

    it('should support inserting at the end of a list', () => {
      const existingTasks = [
        { id: 1, text: 'Task 1', sort_order: 'a0' },
        { id: 2, text: 'Task 2', sort_order: 'a1' },
      ];

      // Insert a new task at the end
      const lastTask = existingTasks[existingTasks.length - 1];
      const newSortOrder = generateKeyBetween(lastTask.sort_order, null);
      const newTask = { id: 3, text: 'New Task', sort_order: newSortOrder };

      const allTasks = [...existingTasks, newTask].sort((a, b) =>
        a.sort_order.localeCompare(b.sort_order)
      );

      expect(allTasks[allTasks.length - 1]).toBe(newTask);
      expect(allTasks.map((t) => t.id)).toEqual([1, 2, 3]);
    });
  });

  describe('Edge cases', () => {
    it('should handle consecutive insertions in the same position', () => {
      const key1 = generateKeyBetween(null, null); // 'a0'
      const key2 = generateKeyBetween(null, key1); // Before key1
      const key3 = generateKeyBetween(null, key2); // Before key2
      const key4 = generateKeyBetween(null, key3); // Before key3

      const keys = [key1, key2, key3, key4].sort();
      expect(keys).toEqual([key4, key3, key2, key1]);
    });

    it('should maintain precision with very close keys', () => {
      const a = 'a0';
      let b = 'a1';

      // Generate 50 keys between the same two positions
      const keys = [];
      for (let i = 0; i < 50; i++) {
        const key = generateKeyBetween(a, b);
        keys.push(key);
        b = key; // Next insertion will be between a and the new key
      }

      // All keys should be unique
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(50);

      // All keys should be between 'a0' and 'a1'
      keys.forEach((key) => {
        expect(key > 'a0').toBe(true);
        expect(key < 'a1').toBe(true);
      });
    });
  });
});
